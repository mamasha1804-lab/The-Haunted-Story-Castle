const choices={
  character:[
    {name:'Witch',phrase:'a little witch'},
    {name:'Ghost',phrase:'a friendly ghost'},
    {name:'Black Cat',phrase:'a curious black cat'},
    {name:'Pumpkin',phrase:'a talking pumpkin'},
    {name:'Vampire',phrase:'a tiny vampire'}
  ],
  setting:[
    {name:'Haunted Castle',phrase:'the haunted castle'},
    {name:'Spooky Forest',phrase:'the spooky forest'},
    {name:'Pumpkin Patch',phrase:'the pumpkin patch'},
    {name:'Old School',phrase:'the old school at night'},
    {name:'Magic Lab',phrase:'the magical Halloween lab'}
  ],
  problem:[
    {name:'Finds a magic book',phrase:'found a magic book'},
    {name:'Meets a new friend',phrase:'met a new friend'},
    {name:'Hears a strange sound',phrase:'heard a strange sound'},
    {name:'Solves a mystery',phrase:'solved a tiny mystery'},
    {name:'Finds a secret door',phrase:'found a secret door'}
  ],
  surprise:[
    {name:'Rainy Candies',phrase:'then colorful candies rained from the sky'},
    {name:'A magic spell',phrase:'then a sparkling spell made everyone giggle'},
    {name:'A hidden treasure',phrase:'then a hidden treasure chest popped open'},
    {name:'A flying broom',phrase:'then a broom started flying'},
    {name:'A ghost appears',phrase:'then a friendly ghost appeared'}
  ]
};
const state={character:choices.character[0],setting:choices.setting[0],problem:choices.problem[0],surprise:choices.surprise[2],sound:true,count:Number(localStorage.getItem('hauntedStoryCount')||0)};
const labels={character:document.getElementById('labelCharacter'),setting:document.getElementById('labelSetting'),problem:document.getElementById('labelProblem'),surprise:document.getElementById('labelSurprise')};
const storyText=document.getElementById('storyText');
const storyCount=document.getElementById('storyCount');
const toast=document.getElementById('toast');
storyCount.textContent=state.count;
function story(){return `${cap(state.character.phrase)} went to ${state.setting.phrase}, ${state.problem.phrase}, and ${state.surprise.phrase}!`;}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function say(text){if(!state.sound||!('speechSynthesis'in window))return; speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.84;u.pitch=1.05;speechSynthesis.speak(u)}
function flash(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>toast.classList.remove('show'),1500)}
function setChoice(slot,index,announce=true){state[slot]=choices[slot][index];labels[slot].textContent=state[slot].name;document.querySelectorAll(`[data-slot="${slot}"]`).forEach((b,i)=>b.classList.toggle('active',i===index));if(announce)say(state[slot].name);}
function roll(slot,announce=true){const i=Math.floor(Math.random()*choices[slot].length);setChoice(slot,i,announce);flash(`${slot==='setting'?'Where':slot==='problem'?'What happened':slot==='surprise'?'Surprise':'Who'}: ${state[slot].name}`)}
function rollAll(){['character','setting','problem','surprise'].forEach((slot,i)=>setTimeout(()=>roll(slot,false),i*110));setTimeout(()=>{state.count+=1;localStorage.setItem('hauntedStoryCount',String(state.count));storyCount.textContent=state.count;storyText.textContent=story();say(story());flash('A new magical story is ready!')},520)}
function render(group,id){const holder=document.getElementById(id);choices[group].forEach((item,index)=>{const b=document.createElement('button');b.type='button';b.dataset.slot=group;b.setAttribute('aria-label',item.name);b.title=item.name;b.addEventListener('click',()=>setChoice(group,index));holder.appendChild(b)})}
render('character','characterChoices');render('setting','settingChoices');render('problem','problemChoices');render('surprise','surpriseChoices');
setChoice('character',0,false);setChoice('setting',0,false);setChoice('problem',0,false);setChoice('surprise',2,false);storyText.textContent=story();
document.querySelectorAll('[data-roll]').forEach(b=>b.addEventListener('click',()=>roll(b.dataset.roll)));
document.getElementById('rollStory').addEventListener('click',rollAll);
document.getElementById('rollAgain').addEventListener('click',rollAll);
document.getElementById('readAloud').addEventListener('click',()=>say(storyText.textContent));
