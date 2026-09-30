const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || undefined,headless:true,args:['--no-sandbox']});
 const errors=[];
 async function setup(options){const context=await browser.newContext(options);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.route('**/script.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__snakeTest={game,tick,stop};'});});await page.goto(process.env.BASE_URL || 'http://127.0.0.1:8000');await page.waitForFunction(()=>window.__snakeTest);return {context,page};}
 async function bounds(page,label){const b=await page.locator('#board').boundingBox();const metrics=await page.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight}));assert.ok(b.x>=0&&b.x+b.width<=metrics.w+1,label+' board width');assert.ok(b.y+b.height<=metrics.h,label+' board height');assert.ok(metrics.sw<=metrics.w,label+' no horizontal overflow');console.log(label,JSON.stringify({board:b,viewport:metrics}));assert.ok(metrics.sh<=metrics.h,label+' entire controls fit');}
 const {context:mobile,page}=await setup({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await bounds(page,'390×844');
 await page.locator('#primary').tap();await page.evaluate(()=>window.__snakeTest.stop());assert.equal(await page.locator('#overlay').isVisible(),false);
 const cdp=await mobile.newCDPSession(page);const b=await page.locator('#board').boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-60}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>window.__snakeTest.game.queue[0]),'up');
 await page.evaluate(()=>{window.__snakeTest.tick();window.__snakeTest.stop();});assert.equal(await page.evaluate(()=>window.__snakeTest.game.direction),'up');assert.equal(await page.evaluate(()=>scrollY),0);
 // Reverse swipe is rejected, direction buttons remain usable.
 await page.locator('[data-direction="down"]').tap();assert.equal(await page.evaluate(()=>window.__snakeTest.game.queue.length),0);
 await page.locator('[data-direction="left"]').tap();assert.equal(await page.evaluate(()=>window.__snakeTest.game.queue[0]),'left');
 await page.evaluate(()=>{const t=window.__snakeTest;t.game.food={x:t.game.snake[0].x-1,y:t.game.snake[0].y};t.tick();t.stop();});assert.equal(await page.locator('#score').textContent(),'10');assert.equal(await page.locator('#best').textContent(),'10');
 await page.locator('#pause').tap();assert.equal(await page.locator('#overlay-title').textContent(),'休息一下。');const snapshot=await page.evaluate(()=>JSON.stringify(window.__snakeTest.game.snake));await page.waitForTimeout(240);assert.equal(await page.evaluate(()=>JSON.stringify(window.__snakeTest.game.snake)),snapshot);
 await page.locator('#primary').tap();await page.evaluate(()=>window.__snakeTest.stop());
 await page.locator('#sound').tap();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');await page.reload();await page.waitForFunction(()=>window.__snakeTest);assert.equal(await page.locator('#best').textContent(),'10');assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 await page.locator('#primary').tap();await page.evaluate(()=>window.__snakeTest.stop());await page.locator('#restart').tap();await page.evaluate(()=>window.__snakeTest.stop());assert.deepEqual(await page.evaluate(()=>{const g=window.__snakeTest.game;return [g.score,g.snake.length,g.direction,g.queue.length,g.interval,g.state];}),[0,3,'right',0,180,'running']);
 await page.evaluate(()=>{const t=window.__snakeTest;t.game.snake=[{x:19,y:2},{x:18,y:2}];t.tick();});assert.equal(await page.locator('#overlay-title').textContent(),'差一点，再来。');assert.equal(await page.locator('#pause').isDisabled(),true);
 await page.setViewportSize({width:844,height:390});await bounds(page,'844×390 landscape');
 await page.setViewportSize({width:390,height:664});await bounds(page,'390×664 compact');
 await page.setViewportSize({width:320,height:568});await bounds(page,'320×568 small');
 const {page:desktop}=await setup({viewport:{width:1440,height:900}});await bounds(desktop,'1440×900 desktop');await desktop.locator('#primary').click();await desktop.evaluate(()=>window.__snakeTest.stop());
 for(const [key,direction] of [['ArrowUp','up'],['a','left'],['ArrowDown','down'],['d','right'],['w','up'],['ArrowLeft','left'],['s','down'],['ArrowRight','right']]){await desktop.keyboard.press(key);assert.equal(await desktop.evaluate(()=>window.__snakeTest.game.queue[0]),direction);await desktop.evaluate(()=>{window.__snakeTest.tick();window.__snakeTest.stop();});}
 await desktop.keyboard.press('Space');assert.equal(await desktop.evaluate(()=>window.__snakeTest.game.state),'paused');await desktop.keyboard.press('Space');await desktop.evaluate(()=>window.__snakeTest.stop());assert.equal(await desktop.evaluate(()=>window.__snakeTest.game.state),'running');await desktop.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await desktop.evaluate(()=>window.__snakeTest.game.state),'paused');
 
 assert.deepEqual(errors,[]);console.log('PASS: touch swipe, direction buttons, score, pause/resume, persistence, restart, game over, keyboard, blur pause; no JavaScript/console errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
