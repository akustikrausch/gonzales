import{j as e}from"./query-CSQiZfg4.js";import{c as r}from"./index-gBiMDNHU.js";/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],i=r("calendar",n);/**
 * @license lucide-react v0.563.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],y=r("x",d);function h({startDate:a,endDate:s,onStartDateChange:l,onEndDateChange:o}){const c=a||s;return e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(i,{className:"w-4 h-4",style:{color:"var(--g-text-secondary)"}}),e.jsx("label",{className:"text-sm",style:{color:"var(--g-text-secondary)"},children:"From"}),e.jsx("input",{type:"datetime-local",value:a,onChange:t=>l(t.target.value),className:"glass-input",style:{width:"auto"}}),e.jsx("label",{className:"text-sm",style:{color:"var(--g-text-secondary)"},children:"To"}),e.jsx("input",{type:"datetime-local",value:s,onChange:t=>o(t.target.value),className:"glass-input",style:{width:"auto"}}),c&&e.jsx("button",{onClick:()=>{l(""),o("")},className:"transition-colors",style:{color:"var(--g-text-secondary)"},title:"Clear filter",onMouseEnter:t=>t.currentTarget.style.color="var(--g-red)",onMouseLeave:t=>t.currentTarget.style.color="var(--g-text-secondary)",children:e.jsx(y,{className:"w-4 h-4"})})]})}export{h as D};
