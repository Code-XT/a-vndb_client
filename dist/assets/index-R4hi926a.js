import{c as _,r as n,j as w}from"./index-CuKYypg4.js";import{M as N,i as I,h as D,P as W,j as A,k as K,L as U}from"./proxy-Cb-N11UI.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X=[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]],ee=_("chevron-down",X);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],te=_("globe",q);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],ne=_("x",B);function H(e,r){if(typeof e=="function")return e(r);e!=null&&(e.current=r)}function F(...e){return r=>{let t=!1;const o=e.map(u=>{const c=H(u,r);return!t&&typeof c=="function"&&(t=!0),c});if(t)return()=>{for(let u=0;u<o.length;u++){const c=o[u];typeof c=="function"?c():H(e[u],null)}}}}function T(...e){return n.useCallback(F(...e),e)}class V extends n.Component{getSnapshotBeforeUpdate(r){const t=this.props.childRef.current;if(t&&r.isPresent&&!this.props.isPresent&&this.props.pop!==!1){const o=t.offsetParent,u=I(o)&&o.offsetWidth||0,c=I(o)&&o.offsetHeight||0,s=this.props.sizeRef.current;s.height=t.offsetHeight||0,s.width=t.offsetWidth||0,s.top=t.offsetTop,s.left=t.offsetLeft,s.right=u-s.width-s.left,s.bottom=c-s.height-s.top}return null}componentDidUpdate(){}render(){return this.props.children}}function Y({children:e,isPresent:r,anchorX:t,anchorY:o,root:u,pop:c}){var f;const s=n.useId(),C=n.useRef(null),k=n.useRef({width:0,height:0,top:0,left:0,right:0,bottom:0}),{nonce:E}=n.useContext(N),l=((f=e.props)==null?void 0:f.ref)??(e==null?void 0:e.ref),g=T(C,l);return n.useInsertionEffect(()=>{const{width:a,height:p,top:x,left:y,right:b,bottom:$}=k.current;if(r||c===!1||!C.current||!a||!p)return;const j=t==="left"?`left: ${y}`:`right: ${b}`,h=o==="bottom"?`bottom: ${$}`:`top: ${x}`;C.current.dataset.motionPopId=s;const m=document.createElement("style");E&&(m.nonce=E);const R=u??document.head;return R.appendChild(m),m.sheet&&m.sheet.insertRule(`
          [data-motion-pop-id="${s}"] {
            position: absolute !important;
            width: ${a}px !important;
            height: ${p}px !important;
            ${j}px !important;
            ${h}px !important;
          }
        `),()=>{R.contains(m)&&R.removeChild(m)}},[r]),w.jsx(V,{isPresent:r,childRef:C,sizeRef:k,pop:c,children:c===!1?e:n.cloneElement(e,{ref:g})})}const J=({children:e,initial:r,isPresent:t,onExitComplete:o,custom:u,presenceAffectsLayout:c,mode:s,anchorX:C,anchorY:k,root:E})=>{const l=D(O),g=n.useId();let f=!0,a=n.useMemo(()=>(f=!1,{id:g,initial:r,isPresent:t,custom:u,onExitComplete:p=>{l.set(p,!0);for(const x of l.values())if(!x)return;o&&o()},register:p=>(l.set(p,!1),()=>l.delete(p))}),[t,l,o]);return c&&f&&(a={...a}),n.useMemo(()=>{l.forEach((p,x)=>l.set(x,!1))},[t]),n.useEffect(()=>{!t&&!l.size&&o&&o()},[t]),e=w.jsx(Y,{pop:s==="popLayout",isPresent:t,anchorX:C,anchorY:k,root:E,children:e}),w.jsx(W.Provider,{value:a,children:e})};function O(){return new Map}const P=e=>e.key||"";function S(e){const r=[];return n.Children.forEach(e,t=>{n.isValidElement(t)&&r.push(t)}),r}const se=({children:e,custom:r,initial:t=!0,onExitComplete:o,presenceAffectsLayout:u=!0,mode:c="sync",propagate:s=!1,anchorX:C="left",anchorY:k="top",root:E})=>{const[l,g]=A(s),f=n.useMemo(()=>S(e),[e]),a=s&&!l?[]:f.map(P),p=n.useRef(!0),x=n.useRef(f),y=D(()=>new Map),b=n.useRef(new Set),[$,j]=n.useState(f),[h,m]=n.useState(f);K(()=>{p.current=!1,x.current=f;for(let d=0;d<h.length;d++){const i=P(h[d]);a.includes(i)?(y.delete(i),b.current.delete(i)):y.get(i)!==!0&&y.set(i,!1)}},[h,a.length,a.join("-")]);const R=[];if(f!==$){let d=[...f];for(let i=0;i<h.length;i++){const M=h[i],L=P(M);a.includes(L)||(d.splice(i,0,M),R.push(M))}return c==="wait"&&R.length&&(d=R),m(S(d)),j(f),null}const{forceRender:v}=n.useContext(U);return w.jsx(w.Fragment,{children:h.map(d=>{const i=P(d),M=s&&!l?!1:f===h||a.includes(i),L=()=>{if(b.current.has(i))return;if(b.current.add(i),y.has(i))y.set(i,!0);else return;let z=!0;y.forEach(G=>{G||(z=!1)}),z&&(v==null||v(),m(x.current),s&&(g==null||g()),o&&o())};return w.jsx(J,{isPresent:M,initial:!p.current||t?void 0:!1,custom:r,presenceAffectsLayout:u,mode:c,root:E,onExitComplete:M?void 0:L,anchorX:C,anchorY:k,children:d},i)})})};export{se as A,ee as C,te as G,ne as X};
