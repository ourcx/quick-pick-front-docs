import{_ as s,c as e,b as a,o as i}from"./app-BZx8hB4l.js";const l={};function c(d,n){return i(),e("div",null,[...n[0]||(n[0]=[a(`<h2 id="使用-uniapp-提供的云函数开发" tabindex="-1"><a class="header-anchor" href="#使用-uniapp-提供的云函数开发"><span>使用 uniapp 提供的云函数开发</span></a></h2><p>小程序计划开通自定义头像功能，经过团队讨论，决定使用微信免费内容审核服务对用户自定义头像进行鉴黄和鉴政审核。</p><h2 id="技术实现" tabindex="-1"><a class="header-anchor" href="#技术实现"><span>技术实现</span></a></h2><h3 id="技术选型" tabindex="-1"><a class="header-anchor" href="#技术选型"><span>技术选型</span></a></h3><p>由于小程序采用 uniapp 开发，优先考虑 uniapp 云平台。参考以下资料：</p><ul><li>咸虾米的技术文章：<a href="https://blog.csdn.net/qq_18798149/article/details/133350733" target="_blank" rel="noopener noreferrer">uni-sec-check内容安全unicloud公共模块</a></li><li>官方文档：<a href="https://doc.dcloud.net.cn/uniCloud/uni-sec-check.html" target="_blank" rel="noopener noreferrer">uni-sec-check 公共模块</a></li></ul><h3 id="实施步骤" tabindex="-1"><a class="header-anchor" href="#实施步骤"><span>实施步骤</span></a></h3><h4 id="_1-创建云函数文件" tabindex="-1"><a class="header-anchor" href="#_1-创建云函数文件"><span>1. 创建云函数文件</span></a></h4><p>在 HBuilderX 中创建新的云函数文件。</p><h4 id="_2-关联服务空间" tabindex="-1"><a class="header-anchor" href="#_2-关联服务空间"><span>2. 关联服务空间</span></a></h4><p>右键点击云函数目录，选择「关联服务空间」，完成服务空间配置。</p><h4 id="_3-安装公共库" tabindex="-1"><a class="header-anchor" href="#_3-安装公共库"><span>3. 安装公共库</span></a></h4><p>从插件市场安装所需公共库：</p><ul><li><a href="https://ext.dcloud.net.cn/plugin?name=uni-sec-check" target="_blank" rel="noopener noreferrer">uni-sec-check 插件</a></li></ul><p><code>uni-sec-check</code> 依赖 <code>uni-open-bridge</code> 配置，需同时安装 <a href="https://uniapp.dcloud.net.cn/uniCloud/uni-open-bridge.html#uni-open-bridge%25E7%259A%2584%25E4%25BD%25BF%25E7%2594%25A8%25E6%25B5%2581%25E7%25A8%258B" target="_blank" rel="noopener noreferrer">uni-open-bridge</a>。</p><h4 id="_4-配置小程序信息" tabindex="-1"><a class="header-anchor" href="#_4-配置小程序信息"><span>4. 配置小程序信息</span></a></h4><p>在 <code>uni-open-bridge</code> 配置文件中设置小程序 ID 和密钥：</p><p>json</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre><code><span class="line">{</span>
<span class="line">  &quot;dcloudAppid&quot;: &quot;__UNI_6E118A6&quot;,</span>
<span class="line">  &quot;mp-weixin&quot;: {</span>
<span class="line">    &quot;oauth&quot;: {</span>
<span class="line">      &quot;weixin&quot;: {</span>
<span class="line">        &quot;appid&quot;: &quot;你的小程序ID&quot;,</span>
<span class="line">        &quot;appsecret&quot;: &quot;你的小程序密钥&quot;</span>
<span class="line">      }</span>
<span class="line">    }</span>
<span class="line">  }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_5-创建云函数" tabindex="-1"><a class="header-anchor" href="#_5-创建云函数"><span>5. 创建云函数</span></a></h4><p>每个云函数需要包含以下文件：</p><ul><li><code>index.js</code> - 主逻辑文件</li><li><code>package.json</code> - 依赖配置文件</li></ul><p><strong>文本内容审核云函数</strong></p><p>javascript</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre><code><span class="line">const UniSecCheck = require(&#39;uni-sec-check&#39;);</span>
<span class="line"></span>
<span class="line">exports.main = async (event, context) =&gt; {</span>
<span class="line">  try {</span>
<span class="line">    const { content, openid = &quot;&quot;, scene = 2, version = 2 } = event;</span>
<span class="line">    </span>
<span class="line">    // 参数校验</span>
<span class="line">    if (!content) {</span>
<span class="line">      return {</span>
<span class="line">        code: 400,</span>
<span class="line">        success: false,</span>
<span class="line">        errMsg: &#39;检测内容不能为空&#39;</span>
<span class="line">      };</span>
<span class="line">    }</span>
<span class="line"></span>
<span class="line">    const uniSecCheck = new UniSecCheck({</span>
<span class="line">      provider: &#39;mp-weixin&#39;,</span>
<span class="line">      requestId: context.requestId,</span>
<span class="line">    });</span>
<span class="line"></span>
<span class="line">    const checkRes = await uniSecCheck.textSecCheck({</span>
<span class="line">      content,</span>
<span class="line">      openid,</span>
<span class="line">      scene,</span>
<span class="line">      version</span>
<span class="line">    });</span>
<span class="line"></span>
<span class="line">    // 处理检测结果</span>
<span class="line">    if (checkRes.errCode === &#39;uni-sec-check-risk-content&#39;) {</span>
<span class="line">      return {</span>
<span class="line">        code: 400,</span>
<span class="line">        success: false,</span>
<span class="line">        errMsg: &#39;内容不合规&#39;,</span>
<span class="line">        result: checkRes.result</span>
<span class="line">      };</span>
<span class="line">    } else if (checkRes.errCode) {</span>
<span class="line">      return {</span>
<span class="line">        code: 500,</span>
<span class="line">        success: false,</span>
<span class="line">        errMsg: \`检测服务异常: \${checkRes.errMsg}\`</span>
<span class="line">      };</span>
<span class="line">    }</span>
<span class="line"></span>
<span class="line">    // 检测通过</span>
<span class="line">    return {</span>
<span class="line">      code: 200,</span>
<span class="line">      success: true,</span>
<span class="line">      errMsg: &#39;内容合规&#39;</span>
<span class="line">    };</span>
<span class="line"></span>
<span class="line">  } catch (error) {</span>
<span class="line">    console.error(&#39;文本检测异常:&#39;, error);</span>
<span class="line">    return {</span>
<span class="line">      code: 500,</span>
<span class="line">      success: false,</span>
<span class="line">      errMsg: \`服务器内部错误: \${error.message}\`</span>
<span class="line">    };</span>
<span class="line">  }</span>
<span class="line">};</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><strong>头像审核云函数</strong></p><p>javascript</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre><code><span class="line">const UniSecCheck = require(&#39;uni-sec-check&#39;)</span>
<span class="line"></span>
<span class="line">exports.main = async function(event, context) {</span>
<span class="line">    // 参数校验</span>
<span class="line">    const { url, openid = &quot;&quot;, scene = 2, version = 2 } = event</span>
<span class="line">    if (!url) {</span>
<span class="line">      return {</span>
<span class="line">        code: 400,</span>
<span class="line">        success: false,</span>
<span class="line">        errMsg: &#39;缺少图片URL参数&#39;</span>
<span class="line">      }</span>
<span class="line">    }</span>
<span class="line"></span>
<span class="line">    // 创建内容安全检测实例</span>
<span class="line">    const uniSecCheck = new UniSecCheck({</span>
<span class="line">      provider: &#39;mp-weixin&#39;,</span>
<span class="line">      requestId: context.requestId</span>
<span class="line">    })</span>
<span class="line"></span>
<span class="line">    // 进行图片安全检测</span>
<span class="line">    console.log(&#39;开始图片安全检测:&#39;, url)</span>
<span class="line">    const imgSecCheckRes = await uniSecCheck.imgSecCheck({</span>
<span class="line">      image: url,</span>
<span class="line">      openid: openid,</span>
<span class="line">      scene: scene,</span>
<span class="line">      version: version</span>
<span class="line">    })</span>
<span class="line"></span>
<span class="line">    console.log(&#39;图片检测结果:&#39;, imgSecCheckRes)</span>
<span class="line"></span>
<span class="line">    // 处理检测结果</span>
<span class="line">    if (imgSecCheckRes.errCode) {</span>
<span class="line">      // 图片违规</span>
<span class="line">      return {</span>
<span class="line">        code: 400,</span>
<span class="line">        success: false,</span>
<span class="line">        errMsg: &#39;图片内容违规&#39;,</span>
<span class="line">        result: {</span>
<span class="line">          label: imgSecCheckRes.result?.label,</span>
<span class="line">          suggest: imgSecCheckRes.result?.suggest</span>
<span class="line">        }</span>
<span class="line">      }</span>
<span class="line">    }</span>
<span class="line">    </span>
<span class="line">    // 检测通过</span>
<span class="line">    return {</span>
<span class="line">      code: 200,</span>
<span class="line">      success: true,</span>
<span class="line">      errMsg: &#39;图片检测通过&#39;,</span>
<span class="line">      data: imgSecCheckRes</span>
<span class="line">    }</span>
<span class="line">}</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="_6-客户端调用" tabindex="-1"><a class="header-anchor" href="#_6-客户端调用"><span>6. 客户端调用</span></a></h4><p>javascript</p><div class="language-text line-numbers-mode" data-highlighter="prismjs" data-ext="text"><pre><code><span class="line">const openid = uni.getStorageSync(&#39;user_openid&#39;);</span>
<span class="line">if (!openid) {</span>
<span class="line">  uni.hideLoading();</span>
<span class="line">  uni.showToast({</span>
<span class="line">    title: &#39;用户信息获取失败&#39;,</span>
<span class="line">    icon: &#39;none&#39;</span>
<span class="line">  });</span>
<span class="line">  return false;</span>
<span class="line">}</span>
<span class="line"></span>
<span class="line">const result = await uniCloud.callFunction({</span>
<span class="line">  name: &#39;avatarCheck&#39;,</span>
<span class="line">  data: {</span>
<span class="line">    url: imageUrl,</span>
<span class="line">    openid: openid,</span>
<span class="line">    scene: 1, // 资料场景（用户头像）</span>
<span class="line">    version: 2</span>
<span class="line">  }</span>
<span class="line">});</span>
<span class="line"></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="注意事项" tabindex="-1"><a class="header-anchor" href="#注意事项"><span>注意事项</span></a></h2><ol><li>用户 openid 需要在用户登录时获取并存储</li><li>v2 异步头像审核模式在不配置异步通知的情况下仍可正常使用</li><li>根据返回结果进行相应的业务逻辑处理</li></ol><p>如有问题或建议，欢迎在评论区讨论交流</p>`,34)])])}const r=s(l,[["render",c]]),v=JSON.parse('{"path":"/util/cloud.html","title":"","lang":"zh-CN","frontmatter":{},"headers":[{"level":2,"title":"使用 uniapp 提供的云函数开发","slug":"使用-uniapp-提供的云函数开发","link":"#使用-uniapp-提供的云函数开发","children":[]},{"level":2,"title":"技术实现","slug":"技术实现","link":"#技术实现","children":[{"level":3,"title":"技术选型","slug":"技术选型","link":"#技术选型","children":[]},{"level":3,"title":"实施步骤","slug":"实施步骤","link":"#实施步骤","children":[]}]},{"level":2,"title":"注意事项","slug":"注意事项","link":"#注意事项","children":[]}],"git":{"updatedTime":1773495944000,"contributors":[{"name":"朱鑫浩","username":"","email":"zhuxinhao@xiaohongshu.com","commits":1}],"changelog":[{"hash":"01fe6dcdb318e9b1a3959209b1db4bca7f07d608","time":1773495944000,"email":"zhuxinhao@xiaohongshu.com","author":"朱鑫浩","message":"feat: 添加基本文章"}]},"filePathRelative":"util/cloud.md"}');export{r as comp,v as data};
