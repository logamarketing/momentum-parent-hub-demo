const CHAT_WEBHOOK_URL="https://logamarketing.app.n8n.cloud/webhook/f227d4d5-1132-44a3-8946-24954202567c";

const answers={
  pickup:"Momentum's current public information lists Piedmont Elementary, Northwood Elementary, Stone Ridge Elementary, Surrey Hills Elementary, Redstone Intermediate, Piedmont Intermediate, and the Early Childhood Center. David would approve the live list before launch.",
  price:"The current public after-school membership lists a $77 weekly rate. A live assistant would always use David's approved current pricing and enrollment terms.",
  ages:"The after-school program is presented for K-5 students. Martial arts serves additional ages, but David would confirm the exact class groups before launch.",
  camp:"For camp, the live answer can cover water bottles, snacks, activity clothing, pickup authorization, and special-event items from one approved checklist.",
  process:"Momentum picks children up from participating schools, then provides homework time, martial arts, sports, games, and creative activities before parent pickup by 6:00 PM.",
  tournament:"The Parent Hub can keep tournament dates, locations, arrival times, registration links, uniform reminders, medal photos, and recaps together.",
  owner:"This system answers common parent questions, captures leads, routes unknown questions to the team, and keeps updates, tournaments, medals, pickup notes, and reminders in one dependable place."
};
const updates=[
  {category:"After-School",title:"Pickup route reminder",message:"A clear place for school changes, closure days, and transportation notes."},
  {category:"Tournaments",title:"Tournament weekend",message:"Arrival time, location, uniform checklist, and registration in one post."},
  {category:"Martial Arts",title:"Belt testing",message:"Testing dates, preparation notes, and what students need to bring."},
  {category:"Summer Camp",title:"Camp week preview",message:"This week's activities, special events, and daily reminders."}
];

const menuToggle=document.querySelector(".menu-toggle");
const mobileMenu=document.querySelector(".mobile-menu");
const welcome=document.querySelector("#assistantWelcome");
const launcher=document.querySelector("#chatLauncher");
const drawer=document.querySelector("#chatDrawer");
const messages=document.querySelector("#messages");
const chatForm=document.querySelector("#chatForm");
const chatInput=document.querySelector("#chatInput");
const updatesGrid=document.querySelector("#updatesGrid");

function toggleMenu(force){
  const open=force??!mobileMenu.classList.contains("open");
  mobileMenu.classList.toggle("open",open);
  mobileMenu.setAttribute("aria-hidden",String(!open));
  menuToggle.setAttribute("aria-expanded",String(open));
  document.body.classList.toggle("menu-open",open);
}
menuToggle.addEventListener("click",()=>toggleMenu());
mobileMenu.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>toggleMenu(false)));

function setChat(open){
  drawer.classList.toggle("open",open);
  drawer.setAttribute("aria-hidden",String(!open));
  launcher.setAttribute("aria-expanded",String(open));
  welcome.classList.remove("show");
  if(open)window.setTimeout(()=>chatInput.focus(),220);
}
launcher.addEventListener("click",()=>setChat(!drawer.classList.contains("open")));
document.querySelector("#chatClose").addEventListener("click",()=>setChat(false));
document.querySelector(".welcome-close").addEventListener("click",()=>welcome.classList.remove("show"));
document.querySelectorAll("[data-open-chat]").forEach(button=>button.addEventListener("click",()=>setChat(true)));
window.setTimeout(()=>{if(!drawer.classList.contains("open"))welcome.classList.add("show")},900);
window.setTimeout(()=>welcome.classList.remove("show"),9000);

function addMessage(text,type){
  const item=document.createElement("div");
  item.className=`message ${type}`;
  item.textContent=text;
  messages.appendChild(item);
  messages.scrollTop=messages.scrollHeight;
  return item;
}
function getAnswer(question){
  const q=question.toLowerCase();
  if(q.includes("price")||q.includes("cost")||q.includes("much")||q.includes("rate"))return answers.price;
  if(q.includes("school")||q.includes("pickup"))return answers.pickup;
  if(q.includes("age")||q.includes("old")||q.includes("grade"))return answers.ages;
  if(q.includes("camp")||q.includes("bring"))return answers.camp;
  if(q.includes("david")||q.includes("owner")||q.includes("system")||q.includes("software")||q.includes("parent hub"))return answers.owner;
  if(q.includes("after-school")||q.includes("afterschool")||q.includes("work"))return answers.process;
  if(q.includes("tournament")||q.includes("medal")||q.includes("belt"))return answers.tournament;
  return "I would answer from Momentum's approved information. If I do not know, I can collect your question for the team instead of sending you to a dead end.";
}
function extractWebhookAnswer(data){
  if(typeof data==="string")return data;
  if(!data||typeof data!=="object")return "";
  if(typeof data.answer==="string")return data.answer;
  if(typeof data.message==="string")return data.message;
  if(typeof data.response==="string")return data.response;
  if(typeof data.text==="string")return data.text;
  const output=Array.isArray(data.output)?data.output:[];
  for(const item of output){
    const content=Array.isArray(item.content)?item.content:[];
    const textItem=content.find(entry=>entry&&entry.type==="output_text"&&typeof entry.text==="string");
    if(textItem)return textItem.text;
  }
  return "";
}
async function getLiveAnswer(question){
  const response=await fetch(CHAT_WEBHOOK_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({message:question,source:"momentum-demo",page:window.location.href})
  });
  if(!response.ok)throw new Error(`Webhook ${response.status}`);
  const data=await response.json();
  const answer=extractWebhookAnswer(data);
  if(!answer)throw new Error("Webhook returned no answer");
  return answer;
}
async function ask(question){
  if(!question.trim())return;
  setChat(true);
  addMessage(question,"user");
  const pending=addMessage("Let me check Momentum's approved information...","bot");
  try{
    pending.textContent=await getLiveAnswer(question);
  }catch(error){
    pending.textContent=getAnswer(question);
  }
  messages.scrollTop=messages.scrollHeight;
}
document.querySelectorAll("[data-question]").forEach(button=>button.addEventListener("click",()=>ask(button.dataset.question)));
chatForm.addEventListener("submit",event=>{event.preventDefault();ask(chatInput.value);chatInput.value=""});

function renderUpdates(filter="All"){
  updatesGrid.innerHTML="";
  updates.filter(item=>filter==="All"||item.category===filter).forEach(item=>{
    const card=document.createElement("article");
    card.className="update-card";
    const category=document.createElement("span");category.textContent=item.category;
    const title=document.createElement("h4");title.textContent=item.title;
    const message=document.createElement("p");message.textContent=item.message;
    card.append(category,title,message);updatesGrid.appendChild(card);
  });
}
document.querySelectorAll("[data-filter]").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll("[data-filter]").forEach(item=>item.classList.remove("active"));
  button.classList.add("active");renderUpdates(button.dataset.filter);
}));
document.querySelector("#updateForm").addEventListener("submit",event=>{
  event.preventDefault();
  const title=document.querySelector("#updateTitle").value.trim();
  const category=document.querySelector("#updateCategory").value;
  const message=document.querySelector("#updateMessage").value.trim();
  if(!title||!message)return;
  updates.unshift({category,title,message});event.currentTarget.reset();
  document.querySelector('[data-filter="All"]').click();
});
document.querySelector("#leadForm").addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  const result=document.querySelector("#leadResult");
  result.textContent=`Demo captured: ${data.get("program")} inquiry. Nothing was sent.`;
  result.classList.add("success");
});
document.addEventListener("keydown",event=>{if(event.key==="Escape"){setChat(false);toggleMenu(false)}});
renderUpdates();
