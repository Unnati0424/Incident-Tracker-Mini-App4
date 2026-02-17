(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function r(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(n){if(n.ep)return;n.ep=!0;const s=r(n);fetch(n.href,s)}})();const f="http://localhost:4000",g=["SEV1","SEV2","SEV3","SEV4+"],y=["OPEN","MITIGATED","RESOLVED"],i={page:1,pageSize:20,totalPages:1,search:"",severity:"",status:"",sortBy:"createdAt",sortDirection:"desc",incidents:[],selectedIncidentId:null,editingIncidentId:null,isLoading:!1,error:""};let m=null;function L(){const t=document.querySelector("#app");t.innerHTML=`
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Incident Tracker</h1>
          <p class="page-subtitle">
            Create, search, and manage incidents with server-side filtering and pagination.
          </p>
        </div>
        <div class="header-meta">
          <span class="pill">Mini App</span>
          <span class="pill pill-accent">Assignment</span>
        </div>
      </header>

      <section class="layout">
        <section class="layout-main">
          <div class="toolbar">
            <div class="toolbar-row">
              <div class="field">
                <label for="search">Search</label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search by title, service, owner, or summary"
                />
              </div>
              <div class="field">
                <label for="severity-filter">Severity</label>
                <select id="severity-filter">
                  <option value="">All severities</option>
                  ${g.map(e=>`<option value="${e}">${e}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="status-filter">Status</label>
                <select id="status-filter">
                  <option value="">All statuses</option>
                  ${y.map(e=>`<option value="${e}">${e}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label for="sort-by">Sort by</label>
                <select id="sort-by">
                  <option value="createdAt">Created at</option>
                  <option value="updatedAt">Updated at</option>
                  <option value="severity">Severity</option>
                  <option value="status">Status</option>
                  <option value="service">Service</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2>Incidents</h2>
              <span id="incident-count" class="badge"></span>
            </div>
            <div id="table-container" class="table-container">
              <table class="incidents-table">
                <thead>
                  <tr>
                    <th data-sort-key="id">ID</th>
                    <th data-sort-key="title">Title</th>
                    <th data-sort-key="service">Service</th>
                    <th data-sort-key="severity">Severity</th>
                    <th data-sort-key="status">Status</th>
                    <th data-sort-key="createdAt">Created</th>
                    <th data-sort-key="updatedAt">Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="incidents-body">
                  <tr>
                    <td colspan="8" class="placeholder">Loading incidents...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <footer class="table-footer">
              <div class="pagination">
                <button id="prev-page" type="button">&larr; Previous</button>
                <span id="pagination-info"></span>
                <button id="next-page" type="button">Next &rarr;</button>
              </div>
            </footer>
          </div>
        </section>

        <aside class="layout-side">
          <section class="card">
            <div class="card-header">
              <h2>Incident details</h2>
            </div>
            <div id="incident-detail" class="incident-detail placeholder">
              Select a row to view full incident details.
            </div>
          </section>

          <section class="card">
            <div class="card-header">
              <h2 id="form-title">Create incident</h2>
            </div>
            <form id="incident-form" class="form">
              <div class="field">
                <label for="title-input">Title</label>
                <input id="title-input" name="title" placeholder="What happened?" required />
              </div>
              <div class="field">
                <label for="service-input">Service</label>
                <input id="service-input" name="service" placeholder="Impacted service" required />
              </div>
              <div class="field-group">
                <div class="field">
                  <label for="severity-input">Severity</label>
                  <select id="severity-input" name="severity" required>
                    ${g.map(e=>`<option value="${e}">${e}</option>`).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="status-input">Status</label>
                  <select id="status-input" name="status" required>
                    ${y.map(e=>`<option value="${e}">${e}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="field">
                <label for="owner-input">Owner</label>
                <input id="owner-input" name="owner" placeholder="Primary responder" />
              </div>
              <div class="field">
                <label for="summary-input">Summary</label>
                <textarea
                  id="summary-input"
                  name="summary"
                  rows="3"
                  placeholder="Short description of impact, scope, and mitigation steps"
                ></textarea>
              </div>

              <div id="form-error" class="form-error" aria-live="polite"></div>

              <div class="form-actions">
                <button id="submit-button" type="submit">Create incident</button>
                <button id="reset-button" type="button" class="secondary">
                  Reset
                </button>
              </div>
            </form>
          </section>
        </aside>
      </section>
    </div>
  `}async function l(){i.isLoading=!0,h(!0),u("");const t=new URLSearchParams;t.set("page",String(i.page)),t.set("pageSize",String(i.pageSize)),i.search&&t.set("search",i.search),i.severity&&t.set("severity",i.severity),i.status&&t.set("status",i.status),i.sortBy&&t.set("sortBy",i.sortBy),t.set("sortDirection",i.sortDirection);try{const e=await fetch(`${f}/api/incidents?${t.toString()}`);if(!e.ok)throw new Error(`Request failed with status ${e.status}`);const r=await e.json();i.incidents=r.data||[],i.totalPages=r.totalPages||1,i.page=r.page||i.page,$()}catch(e){console.error(e),u("Unable to load incidents. Please ensure the backend is running.")}finally{i.isLoading=!1,h(!1)}}function h(t){const e=document.querySelector("#incidents-body"),r=document.querySelector("#prev-page"),a=document.querySelector("#next-page");!e||!r||!a||(r.disabled=t,a.disabled=t,t&&(e.innerHTML=`
      <tr>
        <td colspan="8" class="placeholder">Loading incidents...</td>
      </tr>
    `))}function u(t){i.error=t;const e=document.querySelector("#form-error");e&&(e.textContent=t||"")}function $(){const t=document.querySelector("#incidents-body"),e=document.querySelector("#incident-count"),r=document.querySelector("#pagination-info");if(!t||!e||!r)return;!i.incidents||i.incidents.length===0?t.innerHTML=`
      <tr>
        <td colspan="8" class="placeholder">
          No incidents found for the current filters.
        </td>
      </tr>
    `:t.innerHTML=i.incidents.map(n=>{const s=new Date(n.createdAt),o=new Date(n.updatedAt),c=i.selectedIncidentId===n.id;return`
          <tr data-id="${n.id}" class="${c?"row-selected":""}">
            <td>${n.id}</td>
            <td class="cell-title">${p(n.title)}</td>
            <td>${p(n.service)}</td>
            <td><span class="pill pill-severity pill-${n.severity.toLowerCase().replace("+","plus")}">${n.severity}</span></td>
            <td>
              <select class="status-select">
                ${y.map(d=>`<option value="${d}" ${d===n.status?"selected":""}>${d}</option>`).join("")}
              </select>
            </td>
            <td>${s.toLocaleString()}</td>
            <td>${o.toLocaleString()}</td>
            <td>
              <button type="button" class="small edit-button">Edit</button>
            </td>
          </tr>
        `}).join("");const a=i.totalPages*i.pageSize;e.textContent=`${a} incidents (page ${i.page} of ${i.totalPages})`,r.textContent=`Page ${i.page} of ${i.totalPages}`,q()}function q(){const t=document.querySelector("#incident-detail");if(!t)return;const e=i.incidents.find(r=>r.id===i.selectedIncidentId);if(!e){t.classList.add("placeholder"),t.innerHTML="Select a row to view full incident details.";return}t.classList.remove("placeholder"),t.innerHTML=`
    <div class="detail-header">
      <div>
        <h3>${p(e.title)}</h3>
        <p class="detail-subtitle">
          ${p(e.service)} •
          <span class="pill pill-severity pill-${e.severity.toLowerCase().replace("+","plus")}">${e.severity}</span>
          <span class="pill pill-status">${e.status}</span>
        </p>
      </div>
    </div>
    <dl class="detail-grid">
      <div>
        <dt>ID</dt>
        <dd>${e.id}</dd>
      </div>
      <div>
        <dt>Owner</dt>
        <dd>${e.owner?p(e.owner):"Unassigned"}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>${new Date(e.createdAt).toLocaleString()}</dd>
      </div>
      <div>
        <dt>Last updated</dt>
        <dd>${new Date(e.updatedAt).toLocaleString()}</dd>
      </div>
    </dl>
    <section class="detail-section">
      <h4>Summary</h4>
      <p>${e.summary?p(e.summary):"No summary provided."}</p>
    </section>
  `}async function E(t,e){try{if(!(await fetch(`${f}/api/incidents/${t}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:e})})).ok)throw new Error("Failed to update incident");await l()}catch(r){console.error(r),alert("Unable to update status. Please try again.")}}function I(){const t=document.querySelector("#incidents-body"),e=document.querySelector("#prev-page"),r=document.querySelector("#next-page"),a=document.querySelector("#sort-by");!t||!e||!r||!a||(t.addEventListener("click",n=>{const s=n.target;if(s.closest(".edit-button")||s.closest(".status-select"))return;const o=s.closest("tr[data-id]");if(!o)return;const c=Number(o.getAttribute("data-id"));i.selectedIncidentId=c,$()}),t.addEventListener("change",n=>{const s=n.target;if(!s.classList.contains("status-select"))return;const o=s.closest("tr[data-id]");if(!o)return;const c=Number(o.getAttribute("data-id")),d=s.value;E(c,d)}),t.addEventListener("click",n=>{const s=n.target;if(!s.classList.contains("edit-button"))return;const o=s.closest("tr[data-id]");if(!o)return;const c=Number(o.getAttribute("data-id"));C(c)}),e.addEventListener("click",()=>{i.page>1&&(i.page-=1,l())}),r.addEventListener("click",()=>{i.page<i.totalPages&&(i.page+=1,l())}),a.addEventListener("change",()=>{i.sortBy=a.value,i.page=1,l()}))}function T(){const t=document.querySelector("#search"),e=document.querySelector("#severity-filter"),r=document.querySelector("#status-filter");!t||!e||!r||(t.addEventListener("input",()=>{const a=t.value.trim();m&&clearTimeout(m),m=setTimeout(()=>{i.search=a,i.page=1,l()},400)}),e.addEventListener("change",()=>{i.severity=e.value,i.page=1,l()}),r.addEventListener("change",()=>{i.status=r.value,i.page=1,l()}))}function A(){const t=document.querySelector("#incident-form"),e=document.querySelector("#reset-button");!t||!e||(t.addEventListener("submit",async r=>{r.preventDefault(),u("");const a=new FormData(t),n={title:String(a.get("title")||"").trim(),service:String(a.get("service")||"").trim(),severity:String(a.get("severity")||""),status:String(a.get("status")||""),owner:String(a.get("owner")||"").trim()||void 0,summary:String(a.get("summary")||"").trim()||void 0};if(!n.title||!n.service){u("Title and service are required.");return}const s=!!i.editingIncidentId,o=s?"PATCH":"POST",c=s?`${f}/api/incidents/${i.editingIncidentId}`:`${f}/api/incidents`;try{const d=await fetch(c,{method:o,headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!d.ok){const v=await d.json().catch(()=>null),w=v&&v.errors&&v.errors.join(", ")||v?.error||"Unable to save incident.";throw new Error(w)}await d.json(),b(),await l()}catch(d){console.error(d),u(d.message||"Unable to save incident.")}}),e.addEventListener("click",()=>{b()}))}function b(){const t=document.querySelector("#incident-form"),e=document.querySelector("#form-title"),r=document.querySelector("#submit-button");!t||!e||!r||(t.reset(),i.editingIncidentId=null,e.textContent="Create incident",r.textContent="Create incident",u(""))}function C(t){const e=i.incidents.find(s=>s.id===t);if(!e)return;const r=document.querySelector("#incident-form"),a=document.querySelector("#form-title"),n=document.querySelector("#submit-button");!r||!a||!n||(r.querySelector("#title-input").value=e.title,r.querySelector("#service-input").value=e.service,r.querySelector("#severity-input").value=e.severity,r.querySelector("#status-input").value=e.status,r.querySelector("#owner-input").value=e.owner||"",r.querySelector("#summary-input").value=e.summary||"",i.editingIncidentId=e.id,a.textContent=`Edit incident #${e.id}`,n.textContent="Save changes",u(""))}function p(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function S(){L(),I(),T(),A(),l()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",S):S();
