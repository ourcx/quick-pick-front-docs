<template><div><h1 id="小程序中的sse实现方案" tabindex="-1"><a class="header-anchor" href="#小程序中的sse实现方案"><span>小程序中的SSE实现方案</span></a></h1>
<h2 id="背景介绍" tabindex="-1"><a class="header-anchor" href="#背景介绍"><span>背景介绍</span></a></h2>
<p>在开发校园小程序项目时，需要实现好友推荐功能的实时通知。项目需求是：好友把店铺推荐给其他好友，前端需要实时做出响应。</p>
<p>以前的通信方式主要是：</p>
<ul>
<li><strong>轮询</strong>：定时向服务器请求数据</li>
<li><strong>WebSocket</strong>：双向通信</li>
</ul>
<p>这次项目中采用了另一种方法：<strong>SSE（Server-Sent Events）</strong>，这是一种服务端向客户端发送消息的单向流式通信方式。</p>
<h2 id="sse基础概念" tabindex="-1"><a class="header-anchor" href="#sse基础概念"><span>SSE基础概念</span></a></h2>
<h3 id="什么是sse" tabindex="-1"><a class="header-anchor" href="#什么是sse"><span>什么是SSE？</span></a></h3>
<p>SSE是一种允许服务器向客户端推送数据的技术。与WebSocket不同，SSE是单向的（只能服务端向客户端发送），但它更轻量级，基于HTTP协议。</p>
<h3 id="网页中的sse使用" tabindex="-1"><a class="header-anchor" href="#网页中的sse使用"><span>网页中的SSE使用</span></a></h3>
<p>在网页中，SSE有专门的API：</p>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">const</span> eventSource <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">EventSource</span><span class="token punctuation">(</span><span class="token string">'http://地址'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">eventSource<span class="token punctuation">.</span><span class="token function-variable function">onmessage</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">event</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>event<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="小程序中的sse使用" tabindex="-1"><a class="header-anchor" href="#小程序中的sse使用"><span>小程序中的SSE使用</span></a></h3>
<p>小程序中没有原生的EventSource API，需要使用 <code v-pre>uni.request()</code> 配合 <code v-pre>enableChunked: true</code> 来实现流式接收。</p>
<h2 id="项目实现方案" tabindex="-1"><a class="header-anchor" href="#项目实现方案"><span>项目实现方案</span></a></h2>
<h3 id="核心架构" tabindex="-1"><a class="header-anchor" href="#核心架构"><span>核心架构</span></a></h3>
<p>采用<strong>订阅-发布模式</strong>：</p>
<ol>
<li>建立SSE连接</li>
<li>好友发送推荐消息</li>
<li>前端收到SSE传来的消息</li>
<li>调用已订阅的回调函数</li>
<li>小程序悬浮窗显示小红点</li>
<li>点击悬浮窗打开推荐通知</li>
<li>再次点击跳转到好友推荐</li>
</ol>
<h3 id="完整实现代码" tabindex="-1"><a class="header-anchor" href="#完整实现代码"><span>完整实现代码</span></a></h3>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">let</span> requestTask <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">let</span> reconnectTimer <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">let</span> status <span class="token operator">=</span> <span class="token string">'disconnected'</span><span class="token punctuation">;</span> <span class="token comment">// 'disconnected', 'connecting', 'connected'</span></span>
<span class="line"><span class="token keyword">let</span> listeners <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Set</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token keyword">let</span> restart <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">const</span> <span class="token constant">SSE_URL</span> <span class="token operator">=</span> <span class="token string">'https://localhost:8080/user/sse/subscribe'</span></span>
<span class="line"></span>
<span class="line"><span class="token comment">// 广播消息给所有监听者</span></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">broadcast</span><span class="token punctuation">(</span><span class="token parameter">data</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> listeners<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">listener</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">try</span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token function">listener</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">   console<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token string">"SSE listener 执行出错:"</span><span class="token punctuation">,</span> e<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">handleChunk</span><span class="token punctuation">(</span><span class="token parameter">chunk</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token function">broadcast</span><span class="token punctuation">(</span>chunk<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">connect</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span>requestTask <span class="token operator">||</span> status <span class="token operator">===</span> <span class="token string">'connecting'</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">return</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"SSE: 正在连接..."</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> status <span class="token operator">=</span> <span class="token string">'connecting'</span><span class="token punctuation">;</span></span>
<span class="line"> requestTask <span class="token operator">=</span> uni<span class="token punctuation">.</span><span class="token function">request</span><span class="token punctuation">(</span><span class="token punctuation">{</span></span>
<span class="line">  <span class="token literal-property property">url</span><span class="token operator">:</span> <span class="token constant">SSE_URL</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token literal-property property">method</span><span class="token operator">:</span> <span class="token string">'GET'</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token literal-property property">enableChunked</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token literal-property property">header</span><span class="token operator">:</span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token literal-property property">Accept</span><span class="token operator">:</span> <span class="token string">'text/event-stream'</span><span class="token punctuation">,</span></span>
<span class="line">   <span class="token string-property property">'authentication'</span><span class="token operator">:</span> <span class="token function">getApp</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span>globalData<span class="token punctuation">.</span>token<span class="token punctuation">,</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token literal-property property">responseType</span><span class="token operator">:</span> <span class="token string">'arraybuffer'</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token function-variable function">fail</span><span class="token operator">:</span> <span class="token parameter">error</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">   console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"error:"</span> <span class="token operator">+</span> <span class="token constant">JSON</span><span class="token punctuation">.</span><span class="token function">stringify</span><span class="token punctuation">(</span>error<span class="token punctuation">)</span><span class="token punctuation">)</span></span>
<span class="line">   <span class="token keyword">if</span> <span class="token punctuation">(</span>restart <span class="token operator">&amp;&amp;</span> <span class="token operator">!</span>reconnectTimer<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    reconnectTimer <span class="token operator">=</span> <span class="token function">setTimeout</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">     <span class="token function">connect</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">3000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line">  <span class="token function-variable function">complete</span><span class="token operator">:</span> <span class="token parameter">res</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">   requestTask <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line">   status <span class="token operator">=</span> <span class="token string">'disconnected'</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">   <span class="token keyword">if</span> <span class="token punctuation">(</span>restart <span class="token operator">&amp;&amp;</span> <span class="token operator">!</span>reconnectTimer<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    reconnectTimer <span class="token operator">=</span> <span class="token function">setTimeout</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">     <span class="token function">connect</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">3000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line">  <span class="token comment">// 重要：必须写success、fail、complete中的任意一个</span></span>
<span class="line">  <span class="token comment">// 否则requestTask是一个promise，导致requestTask.onChunkReceived出错</span></span>
<span class="line">  <span class="token comment">// success等在连接建立时不会调用，在调试器可以看到pending的状态，这是正常的</span></span>
<span class="line">  <span class="token comment">// 这里主要是写了重连的方法</span></span>
<span class="line"> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>requestTask<span class="token punctuation">)</span></span>
<span class="line"> <span class="token keyword">const</span> decoder <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">TextDecoder</span><span class="token punctuation">(</span><span class="token string">'utf-8'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token keyword">let</span> buffer <span class="token operator">=</span> <span class="token string">''</span><span class="token punctuation">;</span></span>
<span class="line">        </span>
<span class="line"> <span class="token comment">// 所有后端发来的消息都会调用这个</span></span>
<span class="line"> requestTask<span class="token punctuation">.</span><span class="token function">onChunkReceived</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token parameter">res</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span>res<span class="token punctuation">.</span>data<span class="token punctuation">)</span></span>
<span class="line">  </span>
<span class="line">  <span class="token comment">// res.data 是一个 ArrayBuffer，先转成 Uint8Array</span></span>
<span class="line">  <span class="token keyword">const</span> uint8Array <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Uint8Array</span><span class="token punctuation">(</span>res<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 使用 TextDecoder 将 Uint8Array 解码成字符串</span></span>
<span class="line">  <span class="token keyword">const</span> chunkText <span class="token operator">=</span> decoder<span class="token punctuation">.</span><span class="token function">decode</span><span class="token punctuation">(</span>uint8Array<span class="token punctuation">,</span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token literal-property property">stream</span><span class="token operator">:</span> <span class="token boolean">true</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">  <span class="token comment">// 将新收到的文本块追加到缓冲区</span></span>
<span class="line">  buffer <span class="token operator">+=</span> chunkText<span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// SSE 消息以两个换行符 `\n\n` 分隔</span></span>
<span class="line">  <span class="token keyword">const</span> messages <span class="token operator">=</span> buffer<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">'\n\n'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 最后一个元素可能是不完整的消息，把它放回缓冲区，等待下一个数据块</span></span>
<span class="line">  buffer <span class="token operator">=</span> messages<span class="token punctuation">.</span><span class="token function">pop</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token comment">// 遍历所有完整的消息进行处理</span></span>
<span class="line">  messages<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">message</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>message<span class="token punctuation">)</span> <span class="token keyword">return</span><span class="token punctuation">;</span> </span>
<span class="line">   console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"收到的完整SSE消息:"</span><span class="token punctuation">,</span> message<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token keyword">const</span> sseMessage <span class="token operator">=</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token literal-property property">event</span><span class="token operator">:</span> <span class="token string">'message'</span><span class="token punctuation">,</span></span>
<span class="line">    <span class="token literal-property property">data</span><span class="token operator">:</span> <span class="token keyword">null</span><span class="token punctuation">,</span></span>
<span class="line">   <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token comment">// 逐行解析消息</span></span>
<span class="line">   <span class="token keyword">const</span> lines <span class="token operator">=</span> message<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">'\n'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">const</span> line <span class="token keyword">of</span> lines<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">if</span> <span class="token punctuation">(</span>line<span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token string">'event:'</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">     sseMessage<span class="token punctuation">.</span>event <span class="token operator">=</span> line<span class="token punctuation">.</span><span class="token function">substring</span><span class="token punctuation">(</span><span class="token number">6</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">trim</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token keyword">if</span> <span class="token punctuation">(</span>line<span class="token punctuation">.</span><span class="token function">startsWith</span><span class="token punctuation">(</span><span class="token string">'data:'</span><span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">     <span class="token keyword">const</span> dataPart <span class="token operator">=</span> line<span class="token punctuation">.</span><span class="token function">substring</span><span class="token punctuation">(</span><span class="token number">5</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">trim</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">     <span class="token keyword">if</span> <span class="token punctuation">(</span>sseMessage<span class="token punctuation">.</span>data <span class="token operator">===</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">      sseMessage<span class="token punctuation">.</span>data <span class="token operator">=</span> dataPart<span class="token punctuation">;</span></span>
<span class="line">     <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span></span>
<span class="line">      sseMessage<span class="token punctuation">.</span>data <span class="token operator">+=</span> <span class="token string">'\n'</span> <span class="token operator">+</span> dataPart<span class="token punctuation">;</span></span>
<span class="line">     <span class="token punctuation">}</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">   <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">   <span class="token keyword">if</span> <span class="token punctuation">(</span>sseMessage<span class="token punctuation">.</span>data<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    <span class="token keyword">try</span> <span class="token punctuation">{</span></span>
<span class="line">     sseMessage<span class="token punctuation">.</span>data <span class="token operator">=</span> <span class="token constant">JSON</span><span class="token punctuation">.</span><span class="token function">parse</span><span class="token punctuation">(</span>sseMessage<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">     console<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token string">"解析 data 字段的 JSON 失败:"</span><span class="token punctuation">,</span> e<span class="token punctuation">,</span> <span class="token string">"原始data:"</span><span class="token punctuation">,</span> sseMessage<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    <span class="token punctuation">}</span></span>
<span class="line">   <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line">   console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"最终解析结果:"</span><span class="token punctuation">,</span> sseMessage<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token function">handleChunk</span><span class="token punctuation">(</span>sseMessage<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token keyword">if</span> <span class="token punctuation">(</span>sseMessage<span class="token punctuation">.</span>event <span class="token operator">===</span> <span class="token string">"friend_recommend"</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">    console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"进入emit"</span><span class="token punctuation">,</span> sseMessage<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">    uni<span class="token punctuation">.</span><span class="token function">$emit</span><span class="token punctuation">(</span><span class="token string">'show-recommendation'</span><span class="token punctuation">,</span> sseMessage<span class="token punctuation">.</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token punctuation">}</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 启动 SSE 连接（如果未启动）</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">startSSE</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>requestTask<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token function">connect</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 停止 SSE 连接</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">stopSSE</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">"SSE: 停止连接"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> restart <span class="token operator">=</span> <span class="token boolean">false</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"> <span class="token comment">// 清除重连定时器</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span>reconnectTimer<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token function">clearTimeout</span><span class="token punctuation">(</span>reconnectTimer<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  reconnectTimer <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"> <span class="token comment">// 中止请求</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span>requestTask<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  requestTask<span class="token punctuation">.</span><span class="token function">abort</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  requestTask <span class="token operator">=</span> <span class="token keyword">null</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"> status <span class="token operator">=</span> <span class="token string">'disconnected'</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 订阅消息</span>
<span class="line"> * <span class="token keyword">@param</span> <span class="token class-name"><span class="token punctuation">{</span>Function<span class="token punctuation">}</span></span> <span class="token parameter">callback</span> - 页面用于接收消息的回调函数</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token parameter">callback</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token keyword">typeof</span> callback <span class="token operator">!==</span> <span class="token string">'function'</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token string">"SSE: 订阅失败，回调必须是函数"</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token keyword">return</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>listeners<span class="token punctuation">.</span><span class="token function">has</span><span class="token punctuation">(</span>callback<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  listeners<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>callback<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'SSE: 添加新的监听器，当前数量:'</span><span class="token punctuation">,</span> listeners<span class="token punctuation">.</span>size<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span>requestTask <span class="token operator">||</span> status <span class="token operator">===</span> <span class="token string">'disconnected'</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token function">startSSE</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 取消订阅</span>
<span class="line"> * <span class="token keyword">@param</span> <span class="token class-name"><span class="token punctuation">{</span>Function<span class="token punctuation">}</span></span> <span class="token parameter">callback</span> - 页面之前传入的回调函数</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">unsubscribe</span><span class="token punctuation">(</span><span class="token parameter">callback</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span>listeners<span class="token punctuation">.</span><span class="token function">has</span><span class="token punctuation">(</span>callback<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  listeners<span class="token punctuation">.</span><span class="token function">delete</span><span class="token punctuation">(</span>callback<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'SSE: 移除监听器，当前数量:'</span><span class="token punctuation">,</span> listeners<span class="token punctuation">.</span>size<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line">  <span class="token comment">// 如果没有监听器，则停止连接</span></span>
<span class="line">  <span class="token keyword">if</span> <span class="token punctuation">(</span>listeners<span class="token punctuation">.</span>size <span class="token operator">===</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token function">stopSSE</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 获取当前连接状态</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">getStatus</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">return</span> status<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 获取当前监听器数量</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">getListenerCount</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">return</span> listeners<span class="token punctuation">.</span>size<span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span>
<span class="line"><span class="token doc-comment comment">/**</span>
<span class="line"> * <span class="token keyword">@description</span> 清除所有监听器</span>
<span class="line"> */</span></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">function</span> <span class="token function">clearAllListeners</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'SSE: 清除所有监听器'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> listeners<span class="token punctuation">.</span><span class="token function">clear</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token function">stopSSE</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="关键实现细节" tabindex="-1"><a class="header-anchor" href="#关键实现细节"><span>关键实现细节</span></a></h3>
<h4 id="_1-流式数据接收" tabindex="-1"><a class="header-anchor" href="#_1-流式数据接收"><span>1. 流式数据接收</span></a></h4>
<p>使用 <code v-pre>enableChunked: true</code> 启用分块传输：</p>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line">requestTask <span class="token operator">=</span> uni<span class="token punctuation">.</span><span class="token function">request</span><span class="token punctuation">(</span><span class="token punctuation">{</span></span>
<span class="line"> <span class="token literal-property property">url</span><span class="token operator">:</span> <span class="token constant">SSE_URL</span><span class="token punctuation">,</span></span>
<span class="line"> <span class="token literal-property property">method</span><span class="token operator">:</span> <span class="token string">'GET'</span><span class="token punctuation">,</span></span>
<span class="line"> <span class="token literal-property property">enableChunked</span><span class="token operator">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span></span>
<span class="line"> <span class="token literal-property property">responseType</span><span class="token operator">:</span> <span class="token string">'arraybuffer'</span><span class="token punctuation">,</span></span>
<span class="line"> <span class="token comment">// ...</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_2-消息解析" tabindex="-1"><a class="header-anchor" href="#_2-消息解析"><span>2. 消息解析</span></a></h4>
<p>SSE消息格式：</p>
<ul>
<li>每条消息由 <code v-pre>\n\n</code> 分隔</li>
<li>消息内容包含 <code v-pre>event:</code> 和 <code v-pre>data:</code> 字段</li>
<li>需要处理不完整的消息缓冲</li>
</ul>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">const</span> messages <span class="token operator">=</span> buffer<span class="token punctuation">.</span><span class="token function">split</span><span class="token punctuation">(</span><span class="token string">'\n\n'</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">buffer <span class="token operator">=</span> messages<span class="token punctuation">.</span><span class="token function">pop</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// 保留不完整的消息</span></span>
<span class="line">messages<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">message</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token comment">// 解析消息</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_3-自动重连机制" tabindex="-1"><a class="header-anchor" href="#_3-自动重连机制"><span>3. 自动重连机制</span></a></h4>
<p>连接失败时自动重连，间隔3秒：</p>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token function-variable function">fail</span><span class="token operator">:</span> <span class="token parameter">error</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token keyword">if</span> <span class="token punctuation">(</span>restart <span class="token operator">&amp;&amp;</span> <span class="token operator">!</span>reconnectTimer<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  reconnectTimer <span class="token operator">=</span> <span class="token function">setTimeout</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token function">connect</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">3000</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_4-订阅-发布模式" tabindex="-1"><a class="header-anchor" href="#_4-订阅-发布模式"><span>4. 订阅-发布模式</span></a></h4>
<p>使用 <code v-pre>Set</code> 存储监听器，支持多个页面同时监听：</p>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">let</span> listeners <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">Set</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">function</span> <span class="token function">broadcast</span><span class="token punctuation">(</span><span class="token parameter">data</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line"> listeners<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token parameter">listener</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token keyword">try</span> <span class="token punctuation">{</span></span>
<span class="line">   <span class="token function">listener</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span> <span class="token keyword">catch</span> <span class="token punctuation">(</span>e<span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">   console<span class="token punctuation">.</span><span class="token function">error</span><span class="token punctuation">(</span><span class="token string">"SSE listener 执行出错:"</span><span class="token punctuation">,</span> e<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token punctuation">}</span></span>
<span class="line"> <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="常见问题与解决方案" tabindex="-1"><a class="header-anchor" href="#常见问题与解决方案"><span>常见问题与解决方案</span></a></h2>
<h3 id="问题-中文字符显示为问号" tabindex="-1"><a class="header-anchor" href="#问题-中文字符显示为问号"><span>问题：中文字符显示为问号</span></a></h3>
<p><strong>现象</strong>：用户名等中文数据在传输时，ArrayBuffer中的中文编码都变成了63（问号）。</p>
<p><strong>原因</strong>：后端以字符串形式传输数据，在ArrayBuffer编码过程中丢失了中文字符信息。</p>
<p><strong>解决方案</strong>：后端改为传输二进制数据，而不是字符串。这样可以保证中文字符的完整性。</p>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token comment">// 后端应该发送二进制数据</span></span>
<span class="line"><span class="token comment">// 而不是：data: "用户名"</span></span>
<span class="line"><span class="token comment">// 应该是：二进制编码的用户名数据</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="问题-requesttask-onchunkreceived-出错" tabindex="-1"><a class="header-anchor" href="#问题-requesttask-onchunkreceived-出错"><span>问题：requestTask.onChunkReceived 出错</span></a></h3>
<p><strong>原因</strong>：没有在 <code v-pre>success</code>、<code v-pre>fail</code>、<code v-pre>complete</code> 中的任意一个回调中处理，导致 <code v-pre>requestTask</code> 是一个 Promise 而不是可中止的请求对象。</p>
<p><strong>解决方案</strong>：必须在 <code v-pre>fail</code> 或 <code v-pre>complete</code> 回调中处理重连逻辑，这样 <code v-pre>requestTask</code> 才是正确的请求对象。</p>
<h2 id="使用示例" tabindex="-1"><a class="header-anchor" href="#使用示例"><span>使用示例</span></a></h2>
<h3 id="在页面中订阅消息" tabindex="-1"><a class="header-anchor" href="#在页面中订阅消息"><span>在页面中订阅消息</span></a></h3>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line"><span class="token keyword">import</span> <span class="token punctuation">{</span> subscribe<span class="token punctuation">,</span> unsubscribe<span class="token punctuation">,</span> startSSE <span class="token punctuation">}</span> <span class="token keyword">from</span> <span class="token string">'@/utils/sse'</span></span>
<span class="line"></span>
<span class="line"><span class="token keyword">export</span> <span class="token keyword">default</span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token function">onLoad</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token comment">// 订阅推荐消息</span></span>
<span class="line">  <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function-variable function">handleRecommendation</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token parameter">data</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line">   console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'收到推荐:'</span><span class="token punctuation">,</span> data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line">   <span class="token comment">// 显示悬浮窗、小红点等</span></span>
<span class="line">  <span class="token punctuation">}</span><span class="token punctuation">;</span></span>
<span class="line">  <span class="token function">subscribe</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>handleRecommendation<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span><span class="token punctuation">,</span></span>
<span class="line"> <span class="token function">onUnload</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span></span>
<span class="line">  <span class="token comment">// 取消订阅</span></span>
<span class="line">  <span class="token function">unsubscribe</span><span class="token punctuation">(</span><span class="token keyword">this</span><span class="token punctuation">.</span>handleRecommendation<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"> <span class="token punctuation">}</span></span>
<span class="line"><span class="token punctuation">}</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="监听特定事件" tabindex="-1"><a class="header-anchor" href="#监听特定事件"><span>监听特定事件</span></a></h3>
<div class="language-javascript line-numbers-mode" data-highlighter="prismjs" data-ext="js"><pre v-pre><code><span class="line">uni<span class="token punctuation">.</span><span class="token function">$on</span><span class="token punctuation">(</span><span class="token string">'show-recommendation'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token parameter">data</span><span class="token punctuation">)</span> <span class="token operator">=></span> <span class="token punctuation">{</span></span>
<span class="line"> <span class="token comment">// 处理推荐通知</span></span>
<span class="line"> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'显示推荐通知:'</span><span class="token punctuation">,</span> data<span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></span>
<span class="line"></span></code></pre>
<div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="总结" tabindex="-1"><a class="header-anchor" href="#总结"><span>总结</span></a></h2>
<p>SSE是一种轻量级的服务端推送技术，特别适合单向的实时通知场景。在小程序中实现SSE需要：</p>
<ol>
<li>使用 <code v-pre>uni.request()</code> 配合 <code v-pre>enableChunked: true</code></li>
<li>正确处理 ArrayBuffer 的解码</li>
<li>实现消息缓冲和解析逻辑</li>
<li>提供自动重连机制</li>
<li>使用订阅-发布模式支持多个监听者</li>
<li>注意中文字符编码问题，后端应传输二进制数据</li>
</ol>
<p>这个方案已在校园小程序的好友推荐功能中成功应用。</p>
</div></template>


