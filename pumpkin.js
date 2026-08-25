const gs={sound:true,found:0,friendRound:0,score:0,candyTarget:3,candyChoice:0};
const friends=[['ghost','Find the friendly ghost.'],['cat','Find the black cat.'],['witch','Find the little witch.']];
const patchCount=document.getElementById('patchCount');const patchScore=document.getElementById('patchScore');const toast=document.getElementById('toast');
function say(t){if(!gs.sound||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.8;u.pitch=1.08;speechSynthesis.speak(u)}
function flash(t){toast.textContent=t;toast.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>toast.classList.remove('show'),1500)}
function update(){patchCount.textContent=`${gs.found}/5`;patchScore.textContent=String(gs.score)}
function reset(){gs.found=0;gs.friendRound=0;gs.score=0;gs.candyChoice=0;gs.candyTarget=Math.floor(Math.random()*5)+1;document.querySelectorAll('.pumpkin-target').forEach(b=>b.classList.remove('found'));document.querySelectorAll('.clue-options button').forEach(b=>b.classList.remove('correct','wrong'));document.querySelectorAll('#candyRow button').forEach(b=>b.classList.remove('selected'));document.getElementById('friendClue').classList.remove('show');document.getElementById('candyGame').classList.remove('show');document.getElementById('winMessage').classList.remove('show');update()}
function showFriend(){const r=friends[gs.friendRound];document.getElementById('friendClueText').textContent=r[1];document.getElementById('friendClue').classList.add('show');say(r[1])}
function showCandy(){document.getElementById('friendClue').classList.remove('show');document.getElementById('candyTitle').textContent=`Put ${gs.candyTarget} candies in the basket!`;document.getElementById('candyGame').classList.add('show');say(`Put ${gs.candyTarget} candies in the basket.`)}
function win(){document.getElementById('candyGame').classList.remove('show');document.getElementById('winMessage').classList.add('show');gs.score+=10;localStorage.setItem('hauntedCandyCount',String(Number(localStorage.getItem('hauntedCandyCount')||0)+10));update();say('Great job! You earned ten candy stars!')}

document.getElementById('startAdventure').addEventListener('click',()=>{document.getElementById('startMessage').classList.add('show');say('Find five missing pumpkins.')});
document.getElementById('closeStart').addEventListener('click',()=>document.getElementById('startMessage').classList.remove('show'));
document.getElementById('playAgain').addEventListener('click',()=>{reset();flash('Adventure restarted!')});
document.getElementById('collectReward').addEventListener('click',()=>flash('Collect all 3 stages to earn the chest!'));
document.querySelectorAll('.pumpkin-target').forEach(b=>b.addEventListener('click',()=>{if(b.classList.contains('found'))return;b.classList.add('found');gs.found++;gs.score++;update();say('Pumpkin');flash('Pumpkin!');if(gs.found===5)setTimeout(showFriend,500)}));
document.querySelectorAll('.clue-options button').forEach(b=>b.addEventListener('click',()=>{const expected=friends[gs.friendRound][0];document.querySelectorAll('.clue-options button').forEach(x=>x.classList.remove('wrong'));if(b.dataset.friend===expected){b.classList.add('correct');gs.score++;update();say('Yes! Great listening!');setTimeout(()=>{b.classList.remove('correct');gs.friendRound++;if(gs.friendRound>=friends.length)showCandy();else showFriend()},600)}else{b.classList.add('wrong');say('Try again.')}}));
document.querySelectorAll('#candyRow button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('#candyRow button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');gs.candyChoice=Number(b.textContent)}));
document.getElementById('checkCandy').addEventListener('click',()=>{if(gs.candyChoice===gs.candyTarget)win();else{flash('Try counting again!');say('Try counting again.')}});
document.getElementById('closeWin').addEventListener('click',()=>{reset();flash('Ready for another adventure!')});
reset();
