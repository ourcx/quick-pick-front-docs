# 小程序中的SSE实现方案

## 背景介绍

在开发校园小程序项目时，需要实现好友推荐功能的实时通知。项目需求是：好友把店铺推荐给其他好友，前端需要实时做出响应。

以前的通信方式主要是：
- **轮询**：定时向服务器请求数据
- **WebSocket**：双向通信

这次项目中采用了另一种方法：**SSE（Server-Sent Events）**，这是一种服务端向客户端发送消息的单向流式通信方式。

## SSE基础概念

### 什么是SSE？

SSE是一种允许服务器向客户端推送数据的技术。与WebSocket不同，SSE是单向的（只能服务端向客户端发送），但它更轻量级，基于HTTP协议。

### 网页中的SSE使用

在网页中，SSE有专门的API：

```javascript
const eventSource = new EventSource('http://地址');
eventSource.onmessage = (event) => {
  console.log(event.data);
};
```

### 小程序中的SSE使用

小程序中没有原生的EventSource API，需要使用 `uni.request()` 配合 `enableChunked: true` 来实现流式接收。

## 项目实现方案

### 核心架构

采用**订阅-发布模式**：
1. 建立SSE连接
2. 好友发送推荐消息
3. 前端收到SSE传来的消息
4. 调用已订阅的回调函数
5. 小程序悬浮窗显示小红点
6. 点击悬浮窗打开推荐通知
7. 再次点击跳转到好友推荐

### 完整实现代码

```javascript
let requestTask = null;
let reconnectTimer = null;
let status = 'disconnected'; // 'disconnected', 'connecting', 'connected'
let listeners = new Set();
let restart = true;

const SSE_URL = 'https://localhost:8080/user/sse/subscribe'

// 广播消息给所有监听者
function broadcast(data) {
	listeners.forEach(listener => {
		try {
			listener(data);
		} catch (e) {
			console.error("SSE listener 执行出错:", e);
		}
	});
}

function handleChunk(chunk) {
	broadcast(chunk);
}

function connect() {
	if (requestTask || status === 'connecting') {
		return;
	}
	console.log("SSE: 正在连接...");
	status = 'connecting';
	requestTask = uni.request({
		url: SSE_URL,
		method: 'GET',
		enableChunked: true,
		header: {
			Accept: 'text/event-stream',
			'authentication': getApp().globalData.token,
		},
		responseType: 'arraybuffer',
		fail: error => {
			console.log("error:" + JSON.stringify(error))
			if (restart && !reconnectTimer) {
				reconnectTimer = setTimeout(() => {
					connect();
				}, 3000);
			}
		},
		complete: res => {
			requestTask = null;
			status = 'disconnected';

			if (restart && !reconnectTimer) {
				reconnectTimer = setTimeout(() => {
					connect();
				}, 3000);
			}
		}
		// 重要：必须写success、fail、complete中的任意一个
		// 否则requestTask是一个promise，导致requestTask.onChunkReceived出错
		// success等在连接建立时不会调用，在调试器可以看到pending的状态，这是正常的
		// 这里主要是写了重连的方法
	});
	console.log(requestTask)
	const decoder = new TextDecoder('utf-8');
	let buffer = '';
        
	// 所有后端发来的消息都会调用这个
	requestTask.onChunkReceived((res) => {
		console.log(res.data)
		
		// res.data 是一个 ArrayBuffer，先转成 Uint8Array
		const uint8Array = new Uint8Array(res.data);
		// 使用 TextDecoder 将 Uint8Array 解码成字符串
		const chunkText = decoder.decode(uint8Array, {
			stream: true
		});

		// 将新收到的文本块追加到缓冲区
		buffer += chunkText;
		// SSE 消息以两个换行符 `\n\n` 分隔
		const messages = buffer.split('\n\n');
		// 最后一个元素可能是不完整的消息，把它放回缓冲区，等待下一个数据块
		buffer = messages.pop();
		// 遍历所有完整的消息进行处理
		messages.forEach(message => {
			if (!message) return; 
			console.log("收到的完整SSE消息:", message);
			const sseMessage = {
				event: 'message',
				data: null,
			};
			// 逐行解析消息
			const lines = message.split('\n');
			for (const line of lines) {
				if (line.startsWith('event:')) {
					sseMessage.event = line.substring(6).trim();
				} else if (line.startsWith('data:')) {
					const dataPart = line.substring(5).trim();
					if (sseMessage.data === null) {
						sseMessage.data = dataPart;
					} else {
						sseMessage.data += '\n' + dataPart;
					}
				}
			}

			if (sseMessage.data) {
				try {
					sseMessage.data = JSON.parse(sseMessage.data);
				} catch (e) {
					console.error("解析 data 字段的 JSON 失败:", e, "原始data:", sseMessage.data);
				}
			}

			console.log("最终解析结果:", sseMessage);
			handleChunk(sseMessage);
			if (sseMessage.event === "friend_recommend") {
				console.log("进入emit", sseMessage.data);
				uni.$emit('show-recommendation', sseMessage.data);
			}
		});
	});
}

/**
 * @description 启动 SSE 连接（如果未启动）
 */
export function startSSE() {
	if (!requestTask) {
		connect();
	}
}

/**
 * @description 停止 SSE 连接
 */
export function stopSSE() {
	console.log("SSE: 停止连接");
	restart = false;

	// 清除重连定时器
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}

	// 中止请求
	if (requestTask) {
		requestTask.abort();
		requestTask = null;
	}
	status = 'disconnected'
}

/**
 * @description 订阅消息
 * @param {Function} callback - 页面用于接收消息的回调函数
 */
export function subscribe(callback) {
	if (typeof callback !== 'function') {
		console.error("SSE: 订阅失败，回调必须是函数");
		return;
	}

	if (!listeners.has(callback)) {
		listeners.add(callback);
		console.log('SSE: 添加新的监听器，当前数量:', listeners.size);

		if (!requestTask || status === 'disconnected') {
			startSSE();
		}
	}
}

/**
 * @description 取消订阅
 * @param {Function} callback - 页面之前传入的回调函数
 */
export function unsubscribe(callback) {
	if (listeners.has(callback)) {
		listeners.delete(callback);
		console.log('SSE: 移除监听器，当前数量:', listeners.size);

		// 如果没有监听器，则停止连接
		if (listeners.size === 0) {
			stopSSE();
		}
	}
}

/**
 * @description 获取当前连接状态
 */
export function getStatus() {
	return status;
}

/**
 * @description 获取当前监听器数量
 */
export function getListenerCount() {
	return listeners.size;
}

/**
 * @description 清除所有监听器
 */
export function clearAllListeners() {
	console.log('SSE: 清除所有监听器');
	listeners.clear();
	stopSSE();
}
```

### 关键实现细节

#### 1. 流式数据接收

使用 `enableChunked: true` 启用分块传输：

```javascript
requestTask = uni.request({
	url: SSE_URL,
	method: 'GET',
	enableChunked: true,
	responseType: 'arraybuffer',
	// ...
});
```

#### 2. 消息解析

SSE消息格式：
- 每条消息由 `\n\n` 分隔
- 消息内容包含 `event:` 和 `data:` 字段
- 需要处理不完整的消息缓冲

```javascript
const messages = buffer.split('\n\n');
buffer = messages.pop(); // 保留不完整的消息
messages.forEach(message => {
	// 解析消息
});
```

#### 3. 自动重连机制

连接失败时自动重连，间隔3秒：

```javascript
fail: error => {
	if (restart && !reconnectTimer) {
		reconnectTimer = setTimeout(() => {
			connect();
		}, 3000);
	}
}
```

#### 4. 订阅-发布模式

使用 `Set` 存储监听器，支持多个页面同时监听：

```javascript
let listeners = new Set();

function broadcast(data) {
	listeners.forEach(listener => {
		try {
			listener(data);
		} catch (e) {
			console.error("SSE listener 执行出错:", e);
		}
	});
}
```

## 常见问题与解决方案

### 问题：中文字符显示为问号

**现象**：用户名等中文数据在传输时，ArrayBuffer中的中文编码都变成了63（问号）。

**原因**：后端以字符串形式传输数据，在ArrayBuffer编码过程中丢失了中文字符信息。

**解决方案**：后端改为传输二进制数据，而不是字符串。这样可以保证中文字符的完整性。

```javascript
// 后端应该发送二进制数据
// 而不是：data: "用户名"
// 应该是：二进制编码的用户名数据
```

### 问题：requestTask.onChunkReceived 出错

**原因**：没有在 `success`、`fail`、`complete` 中的任意一个回调中处理，导致 `requestTask` 是一个 Promise 而不是可中止的请求对象。

**解决方案**：必须在 `fail` 或 `complete` 回调中处理重连逻辑，这样 `requestTask` 才是正确的请求对象。

## 使用示例

### 在页面中订阅消息

```javascript
import { subscribe, unsubscribe, startSSE } from '@/utils/sse'

export default {
	onLoad() {
		// 订阅推荐消息
		this.handleRecommendation = (data) => {
			console.log('收到推荐:', data);
			// 显示悬浮窗、小红点等
		};
		subscribe(this.handleRecommendation);
	},
	onUnload() {
		// 取消订阅
		unsubscribe(this.handleRecommendation);
	}
}
```

### 监听特定事件

```javascript
uni.$on('show-recommendation', (data) => {
	// 处理推荐通知
	console.log('显示推荐通知:', data);
});
```

## 总结

SSE是一种轻量级的服务端推送技术，特别适合单向的实时通知场景。在小程序中实现SSE需要：

1. 使用 `uni.request()` 配合 `enableChunked: true`
2. 正确处理 ArrayBuffer 的解码
3. 实现消息缓冲和解析逻辑
4. 提供自动重连机制
5. 使用订阅-发布模式支持多个监听者
6. 注意中文字符编码问题，后端应传输二进制数据

这个方案已在校园小程序的好友推荐功能中成功应用。
