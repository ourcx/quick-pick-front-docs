<template><div><h1 id="通信方案" tabindex="-1"><a class="header-anchor" href="#通信方案"><span>通信方案</span></a></h1>
<p>本分类介绍小程序中各种通信方式的实现方案。</p>
<h2 id="包含内容" tabindex="-1"><a class="header-anchor" href="#包含内容"><span>包含内容</span></a></h2>
<ul>
<li><strong>SSE（Server-Sent Events）</strong> - 服务端推送事件</li>
<li>轮询方案</li>
<li>WebSocket方案</li>
</ul>
<h2 id="选择指南" tabindex="-1"><a class="header-anchor" href="#选择指南"><span>选择指南</span></a></h2>
<table>
<thead>
<tr>
<th>通信方式</th>
<th>特点</th>
<th>适用场景</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>SSE</strong></td>
<td>单向推送、轻量级、基于HTTP</td>
<td>实时通知、消息推送</td>
</tr>
<tr>
<td><strong>轮询</strong></td>
<td>简单、兼容性好</td>
<td>低频更新、简单场景</td>
</tr>
<tr>
<td><strong>WebSocket</strong></td>
<td>双向通信、实时性强</td>
<td>聊天、游戏、高频交互</td>
</tr>
</tbody>
</table>
<h2 id="快速开始" tabindex="-1"><a class="header-anchor" href="#快速开始"><span>快速开始</span></a></h2>
<p>选择你感兴趣的通信方案开始阅读：</p>
<ul>
<li><RouteLink to="/communication/sse-implementation.html">SSE实现方案</RouteLink> - 了解如何在小程序中实现SSE</li>
</ul>
</div></template>


