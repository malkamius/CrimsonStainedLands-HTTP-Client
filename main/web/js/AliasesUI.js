var h=class{constructor(t){this.aliasesList=null;this.editFormContainer=null;this.addAliasBtn=null;this.app=t,this.initializeUIElements(),this.initializeEventListeners()}initializeUIElements(){this.aliasesList=document.getElementById("aliases-list"),this.editFormContainer=document.getElementById("alias-edit-form-container"),this.addAliasBtn=document.getElementById("add-alias")}initializeEventListeners(){this.addAliasBtn&&this.addAliasBtn.addEventListener("click",()=>{this.showEditForm(null,-1)})}loadAliases(){!this.aliasesList||!this.app.settings.Aliases||(this.aliasesList.innerHTML="",this.editFormContainer&&(this.editFormContainer.innerHTML="",this.editFormContainer.classList.remove("active")),this.app.settings.Aliases.forEach((t,o)=>{if(this.aliasesList===null)return;let i=document.createElement("tr");i.dataset.index=o.toString();let a=document.createElement("td");a.textContent=t.alias,i.appendChild(a);let d=document.createElement("td");d.textContent=t.command,i.appendChild(d);let e=document.createElement("td"),n=document.createElement("button");n.textContent="Edit",n.style.marginRight="5px",n.addEventListener("click",()=>{this.showEditForm(t,o)});let s=document.createElement("button");s.textContent="Delete",s.addEventListener("click",()=>{this.app.settings.Aliases.splice(o,1),this.app.saveSettings(),this.loadAliases()}),e.appendChild(n),e.appendChild(s),i.appendChild(e),this.aliasesList.appendChild(i)}))}showEditForm(t,o){if(!this.editFormContainer)return;this.editFormContainer.innerHTML="";let i=document.createElement("h4");i.textContent=o===-1?"Add New Alias":"Edit Alias",this.editFormContainer.appendChild(i);let a=document.createElement("div");a.className="form-row";let d=document.createElement("label");d.textContent="Alias:",d.setAttribute("for","edit-alias-input");let e=document.createElement("input");e.type="text",e.id="edit-alias-input",e.value=t?t.alias:"",e.placeholder="e.g., n, sw, l",a.appendChild(d),a.appendChild(e),this.editFormContainer.appendChild(a);let n=document.createElement("div");n.className="form-row";let s=document.createElement("label");s.textContent="Command:",s.setAttribute("for","edit-alias-cmd-input");let l=document.createElement("input");l.type="text",l.id="edit-alias-cmd-input",l.value=t?t.command:"",l.placeholder="e.g., north, southwest, look",n.appendChild(s),n.appendChild(l),this.editFormContainer.appendChild(n);let r=document.createElement("div");r.innerHTML='<small>Tip: Aliases let you type a shorter command that expands to a longer one. For example, use "n" for "north".</small>',r.style.marginTop="5px",r.style.color="#999",this.editFormContainer.appendChild(r);let c=document.createElement("div");c.className="button-row";let p=document.createElement("button");p.textContent="Save",p.addEventListener("click",()=>{o===-1?this.app.settings.Aliases.push({alias:e.value,command:l.value}):t&&(t.alias=e.value,t.command=l.value),this.app.saveSettings(),this.loadAliases()});let m=document.createElement("button");m.textContent="Cancel",m.style.backgroundColor="#555",m.addEventListener("click",()=>{this.editFormContainer.innerHTML="",this.editFormContainer.classList.remove("active")}),c.appendChild(p),c.appendChild(m),this.editFormContainer.appendChild(c),this.editFormContainer.classList.add("active")}updateUI(){this.loadAliases()}};export{h as AliasesUI};
//# sourceMappingURL=AliasesUI.js.map
