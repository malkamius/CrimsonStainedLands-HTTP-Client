var L=class{constructor(e){this.variablesList=null;this.editFormContainer=null;this.addVariableBtn=null;this.app=e,this.initializeUIElements(),this.initializeEventListeners()}initializeUIElements(){this.variablesList=document.getElementById("variables-list"),this.editFormContainer=document.getElementById("variable-edit-form-container"),this.addVariableBtn=document.getElementById("add-variable")}initializeEventListeners(){this.addVariableBtn&&this.addVariableBtn.addEventListener("click",()=>{this.showEditForm(null,-1)})}loadVariables(){!this.variablesList||!this.app.settings.Variables||(this.variablesList.innerHTML="",this.editFormContainer&&(this.editFormContainer.innerHTML="",this.editFormContainer.classList.remove("active")),this.app.settings.Variables.forEach((e,r)=>{if(this.variablesList===null)return;let l=document.createElement("tr");l.dataset.index=r.toString();let p=document.createElement("td");p.textContent=e.name,l.appendChild(p);let m=document.createElement("td");m.textContent=e.type||"string",l.appendChild(m);let s=document.createElement("td");s.textContent=e.value,l.appendChild(s);let d=document.createElement("td"),c=document.createElement("button");c.textContent="Edit",c.style.marginRight="5px",c.addEventListener("click",()=>{this.showEditForm(e,r)});let a=document.createElement("button");a.textContent="Delete",a.addEventListener("click",()=>{this.app.settings.Variables.splice(r,1),this.app.saveSettings(),this.loadVariables()}),d.appendChild(c),d.appendChild(a),l.appendChild(d),this.variablesList.appendChild(l)}))}showEditForm(e,r){if(!this.editFormContainer)return;this.editFormContainer.innerHTML="";let l=document.createElement("h4");l.textContent=r===-1?"Add New Variable":"Edit Variable",this.editFormContainer.appendChild(l);let p=document.createElement("div");p.className="form-row";let m=document.createElement("label");m.textContent="Name:",m.setAttribute("for","edit-variable-name");let s=document.createElement("input");s.type="text",s.id="edit-variable-name",s.value=e?e.name:"",s.placeholder="e.g., HP, TARGET, LOCATION",p.appendChild(m),p.appendChild(s),this.editFormContainer.appendChild(p);let d=document.createElement("div");d.className="form-row";let c=document.createElement("label");c.textContent="Type:",c.setAttribute("for","edit-variable-type");let a=document.createElement("select");a.id="edit-variable-type",["string","number","boolean"].forEach(t=>{let i=document.createElement("option");i.value=t,i.textContent=t.charAt(0).toUpperCase()+t.slice(1),(e&&e.type===t||!e&&t==="string")&&(i.selected=!0),a.appendChild(i)}),d.appendChild(c),d.appendChild(a),this.editFormContainer.appendChild(d);let v=document.createElement("div");v.className="form-row";let f=document.createElement("label");f.textContent="Value:",f.setAttribute("for","edit-variable-value");let n=document.createElement("input");n.type="text",n.id="edit-variable-value",n.value=e?e.value:"",n.placeholder="Enter variable value",v.appendChild(f),v.appendChild(n),this.editFormContainer.appendChild(v);let C=document.createElement("div");C.innerHTML='<small>Tip: Variables can be used in commands with the $VARNAME syntax. For example, "attack $TARGET" will be replaced with the value of the TARGET variable.</small>',C.style.marginTop="5px",C.style.color="#999",this.editFormContainer.appendChild(C);let u=document.createElement("div");u.className="button-row",u.style.marginTop="20px";let y=document.createElement("button");y.textContent="Save",y.addEventListener("click",()=>{let t=s.value.trim().toUpperCase();if(!t){this.app.showNotification("Variable name cannot be empty",!1);return}if(!/^[A-Z0-9_]+$/.test(t)){this.app.showNotification("Variable name can only contain letters, numbers, and underscores",!1);return}if(this.app.settings.Variables.findIndex(h=>h.name.toUpperCase()===t&&(r===-1||this.app.settings.Variables.indexOf(h)!==r))!==-1){this.app.showNotification(`A variable with the name "${t}" already exists`,!1);return}let o=n.value,b=a.value;if(b==="number"){let h=parseFloat(o);if(isNaN(h)){this.app.showNotification("Please enter a valid number",!1);return}o=h.toString()}else b==="boolean"&&(o=o.toLowerCase(),["true","1","yes","y","on"].includes(o)?o="true":o="false");r===-1?this.app.settings.Variables.push({name:t,type:b,value:o}):e&&(e.name=t,e.type=b,e.value=o),this.app.saveSettings(),this.loadVariables()});let E=document.createElement("button");if(E.textContent="Cancel",E.style.backgroundColor="#555",E.addEventListener("click",()=>{this.editFormContainer&&(this.editFormContainer.innerHTML="",this.editFormContainer.classList.remove("active"))}),u.appendChild(y),u.appendChild(E),this.editFormContainer.appendChild(u),this.editFormContainer.classList.add("active"),a.addEventListener("change",()=>{let t=a.value;if(t==="boolean"){n.placeholder="Enter true or false";let i=n.value.toLowerCase();["true","false","0","1","yes","no","y","n","on","off"].includes(i)||(n.value="false")}else if(t==="number"){n.placeholder="Enter a number",n.type="number";let i=parseFloat(n.value);isNaN(i)&&(n.value="0")}else n.placeholder="Enter variable value",n.type="text"}),e&&e.type){let t=new Event("change");a.dispatchEvent(t)}}updateUI(){this.loadVariables()}};export{L as VariablesUI};
//# sourceMappingURL=VariablesUI.js.map
