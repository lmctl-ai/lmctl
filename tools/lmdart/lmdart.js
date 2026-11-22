(function dartProgram(){function copyProperties(a,b){var s=Object.keys(a)
for(var r=0;r<s.length;r++){var q=s[r]
b[q]=a[q]}}function mixinPropertiesHard(a,b){var s=Object.keys(a)
for(var r=0;r<s.length;r++){var q=s[r]
if(!b.hasOwnProperty(q)){b[q]=a[q]}}}function mixinPropertiesEasy(a,b){Object.assign(b,a)}var z=function(){var s=function(){}
s.prototype={p:{}}
var r=new s()
if(!(Object.getPrototypeOf(r)&&Object.getPrototypeOf(r).p===s.prototype.p))return false
try{if(typeof navigator!="undefined"&&typeof navigator.userAgent=="string"&&navigator.userAgent.indexOf("Chrome/")>=0)return true
if(typeof version=="function"&&version.length==0){var q=version()
if(/^\d+\.\d+\.\d+\.\d+$/.test(q))return true}}catch(p){}return false}()
function inherit(a,b){a.prototype.constructor=a
a.prototype["$i"+a.name]=a
if(b!=null){if(z){Object.setPrototypeOf(a.prototype,b.prototype)
return}var s=Object.create(b.prototype)
copyProperties(a.prototype,s)
a.prototype=s}}function inheritMany(a,b){for(var s=0;s<b.length;s++){inherit(b[s],a)}}function mixinEasy(a,b){mixinPropertiesEasy(b.prototype,a.prototype)
a.prototype.constructor=a}function mixinHard(a,b){mixinPropertiesHard(b.prototype,a.prototype)
a.prototype.constructor=a}function lazy(a,b,c,d){var s=a
a[b]=s
a[c]=function(){if(a[b]===s){a[b]=d()}a[c]=function(){return this[b]}
return a[b]}}function lazyFinal(a,b,c,d){var s=a
a[b]=s
a[c]=function(){if(a[b]===s){var r=d()
if(a[b]!==s){A.jS(b)}a[b]=r}var q=a[b]
a[c]=function(){return q}
return q}}function makeConstList(a,b){if(b!=null)A.i(a,b)
a.$flags=7
return a}function convertToFastObject(a){function t(){}t.prototype=a
new t()
return a}function convertAllToFastObject(a){for(var s=0;s<a.length;++s){convertToFastObject(a[s])}}var y=0
function instanceTearOffGetter(a,b){var s=null
return a?function(c){if(s===null)s=A.eT(b)
return new s(c,this)}:function(){if(s===null)s=A.eT(b)
return new s(this,null)}}function staticTearOffGetter(a){var s=null
return function(){if(s===null)s=A.eT(a).prototype
return s}}var x=0
function tearOffParameters(a,b,c,d,e,f,g,h,i,j){if(typeof h=="number"){h+=x}return{co:a,iS:b,iI:c,rC:d,dV:e,cs:f,fs:g,fT:h,aI:i||0,nDA:j}}function installStaticTearOff(a,b,c,d,e,f,g,h){var s=tearOffParameters(a,true,false,c,d,e,f,g,h,false)
var r=staticTearOffGetter(s)
a[b]=r}function installInstanceTearOff(a,b,c,d,e,f,g,h,i,j){c=!!c
var s=tearOffParameters(a,false,c,d,e,f,g,h,i,!!j)
var r=instanceTearOffGetter(c,s)
a[b]=r}function setOrUpdateInterceptorsByTag(a){var s=v.interceptorsByTag
if(!s){v.interceptorsByTag=a
return}copyProperties(a,s)}function setOrUpdateLeafTags(a){var s=v.leafTags
if(!s){v.leafTags=a
return}copyProperties(a,s)}function updateTypes(a){var s=v.types
var r=s.length
s.push.apply(s,a)
return r}function updateHolder(a,b){copyProperties(b,a)
return a}var hunkHelpers=function(){var s=function(a,b,c,d,e){return function(f,g,h,i){return installInstanceTearOff(f,g,a,b,c,d,[h],i,e,false)}},r=function(a,b,c,d){return function(e,f,g,h){return installStaticTearOff(e,f,a,b,c,[g],h,d)}}
return{inherit:inherit,inheritMany:inheritMany,mixin:mixinEasy,mixinHard:mixinHard,installStaticTearOff:installStaticTearOff,installInstanceTearOff:installInstanceTearOff,_instance_0u:s(0,0,null,["$0"],0),_instance_1u:s(0,1,null,["$1"],0),_instance_2u:s(0,2,null,["$2"],0),_instance_0i:s(1,0,null,["$0"],0),_instance_1i:s(1,1,null,["$1"],0),_instance_2i:s(1,2,null,["$2"],0),_static_0:r(0,null,["$0"],0),_static_1:r(1,null,["$1"],0),_static_2:r(2,null,["$2"],0),makeConstList:makeConstList,lazy:lazy,lazyFinal:lazyFinal,updateHolder:updateHolder,convertToFastObject:convertToFastObject,updateTypes:updateTypes,setOrUpdateInterceptorsByTag:setOrUpdateInterceptorsByTag,setOrUpdateLeafTags:setOrUpdateLeafTags}}()
function initializeDeferredHunk(a){x=v.types.length
a(hunkHelpers,v,w,$)}var J={
f_(a,b,c,d){return{i:a,p:b,e:c,x:d}},
eW(a){var s,r,q,p,o,n="_$dart_js",m=a[v.dispatchPropertyName]
if(m==null)if($.eY==null){A.jG()
m=a[v.dispatchPropertyName]}if(m!=null){s=m.p
if(!1===s)return m.i
if(!0===s)return a
r=Object.getPrototypeOf(a)
if(s===r)return m.i
if(m.e===r)throw A.b(A.fq("Return interceptor for "+A.h(s(a,m))))}q=a.constructor
if(q==null)p=null
else{o=$.dA
if(o==null)o=$.dA=A.ei(n)
p=q[o]}if(p!=null)return p
p=A.jL(a)
if(p!=null)return p
if(typeof a=="function")return B.x
s=Object.getPrototypeOf(a)
if(s==null)return B.n
if(s===Object.prototype)return B.n
if(typeof q=="function"){o=$.dA
if(o==null)o=$.dA=A.ei(n)
Object.defineProperty(q,o,{value:B.i,enumerable:false,writable:true,configurable:true})
return B.i}return B.i},
hA(a,b){if(a<0||a>4294967295)throw A.b(A.bo(a,0,4294967295,"length",null))
return J.hC(new Array(a),b)},
hB(a,b){if(a<0)throw A.b(A.I("Length must be a non-negative integer: "+a,null))
return A.i(new Array(a),b.h("A<0>"))},
hC(a,b){var s=A.i(a,b.h("A<0>"))
s.$flags=1
return s},
fd(a){if(a<256)switch(a){case 9:case 10:case 11:case 12:case 13:case 32:case 133:case 160:return!0
default:return!1}switch(a){case 5760:case 8192:case 8193:case 8194:case 8195:case 8196:case 8197:case 8198:case 8199:case 8200:case 8201:case 8202:case 8232:case 8233:case 8239:case 8287:case 12288:case 65279:return!0
default:return!1}},
hD(a,b){var s,r
for(s=a.length;b<s;){r=a.charCodeAt(b)
if(r!==32&&r!==13&&!J.fd(r))break;++b}return b},
hE(a,b){var s,r,q
for(s=a.length;b>0;b=r){r=b-1
if(!(r<s))return A.t(a,r)
q=a.charCodeAt(r)
if(q!==32&&q!==13&&!J.fd(q))break}return b},
aI(a){if(typeof a=="number"){if(Math.floor(a)==a)return J.b8.prototype
return J.c2.prototype}if(typeof a=="string")return J.aQ.prototype
if(a==null)return J.b9.prototype
if(typeof a=="boolean")return J.c1.prototype
if(Array.isArray(a))return J.A.prototype
if(typeof a!="object"){if(typeof a=="function")return J.P.prototype
if(typeof a=="symbol")return J.bd.prototype
if(typeof a=="bigint")return J.bb.prototype
return a}if(a instanceof A.c)return a
return J.eW(a)},
fY(a){if(typeof a=="string")return J.aQ.prototype
if(a==null)return a
if(Array.isArray(a))return J.A.prototype
if(typeof a!="object"){if(typeof a=="function")return J.P.prototype
if(typeof a=="symbol")return J.bd.prototype
if(typeof a=="bigint")return J.bb.prototype
return a}if(a instanceof A.c)return a
return J.eW(a)},
eV(a){if(a==null)return a
if(Array.isArray(a))return J.A.prototype
if(typeof a!="object"){if(typeof a=="function")return J.P.prototype
if(typeof a=="symbol")return J.bd.prototype
if(typeof a=="bigint")return J.bb.prototype
return a}if(a instanceof A.c)return a
return J.eW(a)},
f2(a,b){if(a==null)return b==null
if(typeof a!="object")return b!=null&&a===b
return J.aI(a).E(a,b)},
f3(a,b){return J.eV(a).B(a,b)},
b1(a){return J.aI(a).gu(a)},
cy(a){return J.eV(a).gv(a)},
ex(a){return J.fY(a).gk(a)},
hl(a){return J.aI(a).gt(a)},
a_(a,b,c){return J.eV(a).X(a,b,c)},
aN(a){return J.aI(a).j(a)},
c_:function c_(){},
c1:function c1(){},
b9:function b9(){},
bc:function bc(){},
as:function as(){},
cd:function cd(){},
bu:function bu(){},
P:function P(){},
bb:function bb(){},
bd:function bd(){},
A:function A(a){this.$ti=a},
c0:function c0(){},
cJ:function cJ(a){this.$ti=a},
b2:function b2(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
ba:function ba(){},
b8:function b8(){},
c2:function c2(){},
aQ:function aQ(){}},A={eD:function eD(){},
hH(a){return new A.be("Field '"+a+"' has not been initialized.")},
fo(a,b){a=a+b&536870911
a=a+((a&524287)<<10)&536870911
return a^a>>>6},
i4(a){a=a+((a&67108863)<<3)&536870911
a^=a>>>11
return a+((a&16383)<<15)&536870911},
eS(a,b,c){return a},
eZ(a){var s,r
for(s=$.V.length,r=0;r<s;++r)if(a===$.V[r])return!0
return!1},
i3(a,b,c,d){A.fl(b,"start")
return new A.bt(a,b,c,d.h("bt<0>"))},
hJ(a,b,c,d){if(t.r.b(a))return new A.b3(a,b,c.h("@<0>").m(d).h("b3<1,2>"))
return new A.aE(a,b,c.h("@<0>").m(d).h("aE<1,2>"))},
eC(){return new A.br("No element")},
be:function be(a){this.a=a},
d4:function d4(){},
k:function k(){},
q:function q(){},
bt:function bt(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
aa:function aa(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
aE:function aE(a,b,c){this.a=a
this.b=b
this.$ti=c},
b3:function b3(a,b,c){this.a=a
this.b=b
this.$ti=c},
bh:function bh(a,b,c){var _=this
_.a=null
_.b=a
_.c=b
_.$ti=c},
y:function y(a,b,c){this.a=a
this.b=b
this.$ti=c},
b6:function b6(a,b,c){this.a=a
this.b=b
this.$ti=c},
b7:function b7(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=null
_.$ti=d},
b4:function b4(a){this.$ti=a},
M:function M(){},
h7(a){var s=A.h6(a)
if(s!=null)return s
return"minified:"+a},
ke(a,b){var s
if(b!=null){s=b.x
if(s!=null)return s}return t.da.b(a)},
h(a){var s
if(typeof a=="string")return a
if(typeof a=="number"){if(a!==0)return""+a}else if(!0===a)return"true"
else if(!1===a)return"false"
else if(a==null)return"null"
s=J.aN(a)
return s},
ce(a){var s,r=$.fj
if(r==null)r=$.fj=Symbol("identityHashCode")
s=a[r]
if(s==null){s=Math.random()*0x3fffffff|0
a[r]=s}return s},
hV(a,b){var s,r,q,p,o,n=null,m=/^\s*[+-]?((0x[a-f0-9]+)|(\d+)|([a-z0-9]+))\s*$/i.exec(a)
if(m==null)return n
if(3>=m.length)return A.t(m,3)
s=m[3]
if(b<2||b>36)throw A.b(A.bo(b,2,36,"radix",n))
if(b===10&&s!=null)return parseInt(a,10)
if(b<10||s==null){r=b<=10?47+b:86+b
q=m[1]
for(p=q.length,o=0;o<p;++o)if((q.charCodeAt(o)|32)>r)return n}return parseInt(a,b)},
hU(a){var s,r
if(!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(a))return null
s=parseFloat(a)
if(isNaN(s)){r=B.h.bk(a)
if(r==="NaN"||r==="+NaN"||r==="-NaN")return s
return null}return s},
cf(a){var s,r,q,p
if(a instanceof A.c)return A.N(A.aK(a),null)
s=J.aI(a)
if(s===B.w||s===B.y||t.o.b(a)){r=B.k(a)
if(r!=="Object"&&r!=="")return r
q=a.constructor
if(typeof q=="function"){p=q.name
if(typeof p=="string"&&p!=="Object"&&p!=="")return p}}return A.N(A.aK(a),null)},
hW(a){var s,r,q
if(typeof a=="number"||A.dV(a))return J.aN(a)
if(typeof a=="string")return JSON.stringify(a)
if(a instanceof A.L)return a.j(0)
s=$.hk()
for(r=0;r<1;++r){q=s[r].bl(a)
if(q!=null)return q}return"Instance of '"+A.cf(a)+"'"},
aV(a){if(a.date===void 0)a.date=new Date(a.a)
return a.date},
hT(a){var s=A.aV(a).getUTCFullYear()+0
return s},
hR(a){var s=A.aV(a).getUTCMonth()+1
return s},
hN(a){var s=A.aV(a).getUTCDate()+0
return s},
hO(a){var s=A.aV(a).getUTCHours()+0
return s},
hQ(a){var s=A.aV(a).getUTCMinutes()+0
return s},
hS(a){var s=A.aV(a).getUTCSeconds()+0
return s},
hP(a){var s=A.aV(a).getUTCMilliseconds()+0
return s},
hM(a){var s=a.$thrownJsError
if(s==null)return null
return A.aJ(s)},
fk(a,b){var s
if(a.$thrownJsError==null){s=new Error()
A.B(a,s)
a.$thrownJsError=s
s.stack=b.j(0)}},
t(a,b){if(a==null)J.ex(a)
throw A.b(A.fW(a,b))},
fW(a,b){var s,r="index"
if(!A.fK(b))return new A.a4(!0,b,r,null)
s=A.E(J.ex(a))
if(b<0||b>=s)return A.eB(b,s,a,r)
return new A.bn(null,null,!0,b,r,"Value not in range")},
jo(a){return new A.a4(!0,a,null,null)},
b(a){return A.B(a,new Error())},
B(a,b){var s
if(a==null)a=new A.ad()
b.dartException=a
s=A.jT
if("defineProperty" in Object){Object.defineProperty(b,"message",{get:s})
b.name=""}else b.toString=s
return b},
jT(){return J.aN(this.dartException)},
m(a,b){throw A.B(a,b==null?new Error():b)},
bP(a,b,c){var s
if(b==null)b=0
if(c==null)c=0
s=Error()
A.m(A.iK(a,b,c),s)},
iK(a,b,c){var s,r,q,p,o,n,m,l,k
if(typeof b=="string")s=b
else{r="[]=;add;removeWhere;retainWhere;removeRange;setRange;setInt8;setInt16;setInt32;setUint8;setUint16;setUint32;setFloat32;setFloat64".split(";")
q=r.length
p=b
if(p>q){c=p/q|0
p%=q}s=r[p]}o=typeof c=="string"?c:"modify;remove from;add to".split(";")[c]
n=t.c.b(a)?"list":"ByteData"
m=a.$flags|0
l="a "
if((m&4)!==0)k="constant "
else if((m&2)!==0){k="unmodifiable "
l="an "}else k=(m&1)!==0?"fixed-length ":""
return new A.bv("'"+s+"': Cannot "+o+" "+l+k+n)},
O(a){throw A.b(A.S(a))},
ae(a){var s,r,q,p,o,n
a=A.jQ(a.replace(String({}),"$receiver$"))
s=a.match(/\\\$[a-zA-Z]+\\\$/g)
if(s==null)s=A.i([],t.s)
r=s.indexOf("\\$arguments\\$")
q=s.indexOf("\\$argumentsExpr\\$")
p=s.indexOf("\\$expr\\$")
o=s.indexOf("\\$method\\$")
n=s.indexOf("\\$receiver\\$")
return new A.d7(a.replace(new RegExp("\\\\\\$arguments\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$argumentsExpr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$expr\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$method\\\\\\$","g"),"((?:x|[^x])*)").replace(new RegExp("\\\\\\$receiver\\\\\\$","g"),"((?:x|[^x])*)"),r,q,p,o,n)},
d8(a){return function($expr$){var $argumentsExpr$="$arguments$"
try{$expr$.$method$($argumentsExpr$)}catch(s){return s.message}}(a)},
fp(a){return function($expr$){try{$expr$.$method$}catch(s){return s.message}}(a)},
eE(a,b){var s=b==null,r=s?null:b.method
return new A.c3(a,r,s?null:b.receiver)},
aM(a){var s
if(a==null)return new A.cV(a)
if(a instanceof A.b5){s=a.a
return A.ay(a,s==null?A.bK(s):s)}if(typeof a!=="object")return a
if("dartException" in a)return A.ay(a,a.dartException)
return A.jm(a)},
ay(a,b){if(t.C.b(b))if(b.$thrownJsError==null)b.$thrownJsError=a
return b},
jm(a){var s,r,q,p,o,n,m,l,k,j,i,h,g
if(!("message" in a))return a
s=a.message
if("number" in a&&typeof a.number=="number"){r=a.number
q=r&65535
if((B.c.b0(r,16)&8191)===10)switch(q){case 438:return A.ay(a,A.eE(A.h(s)+" (Error "+q+")",null))
case 445:case 5007:A.h(s)
return A.ay(a,new A.bm())}}if(a instanceof TypeError){p=$.h9()
o=$.ha()
n=$.hb()
m=$.hc()
l=$.hf()
k=$.hg()
j=$.he()
$.hd()
i=$.hi()
h=$.hh()
g=p.C(s)
if(g!=null)return A.ay(a,A.eE(A.G(s),g))
else{g=o.C(s)
if(g!=null){g.method="call"
return A.ay(a,A.eE(A.G(s),g))}else if(n.C(s)!=null||m.C(s)!=null||l.C(s)!=null||k.C(s)!=null||j.C(s)!=null||m.C(s)!=null||i.C(s)!=null||h.C(s)!=null){A.G(s)
return A.ay(a,new A.bm())}}return A.ay(a,new A.cm(typeof s=="string"?s:""))}if(a instanceof RangeError){if(typeof s=="string"&&s.indexOf("call stack")!==-1)return new A.bq()
s=function(b){try{return String(b)}catch(f){}return null}(a)
return A.ay(a,new A.a4(!1,null,null,typeof s=="string"?s.replace(/^RangeError:\s*/,""):s))}if(typeof InternalError=="function"&&a instanceof InternalError)if(typeof s=="string"&&s==="too much recursion")return new A.bq()
return a},
aJ(a){var s
if(a instanceof A.b5)return a.b
if(a==null)return new A.bG(a)
s=a.$cachedTrace
if(s!=null)return s
s=new A.bG(a)
if(typeof a==="object")a.$cachedTrace=s
return s},
es(a){if(a==null)return J.b1(a)
if(typeof a=="object")return A.ce(a)
return J.b1(a)},
jA(a,b){var s,r,q,p=a.length
for(s=0;s<p;s=q){r=s+1
q=r+1
b.A(0,a[s],a[r])}return b},
iV(a,b,c,d,e,f){t.Z.a(a)
switch(A.E(b)){case 0:return a.$0()
case 1:return a.$1(c)
case 2:return a.$2(c,d)
case 3:return a.$3(c,d,e)
case 4:return a.$4(c,d,e,f)}throw A.b(new A.dp("Unsupported number of arguments for wrapped closure"))},
bO(a,b){var s=a.$identity
if(!!s)return s
s=A.jw(a,b)
a.$identity=s
return s},
jw(a,b){var s
switch(b){case 0:s=a.$0
break
case 1:s=a.$1
break
case 2:s=a.$2
break
case 3:s=a.$3
break
case 4:s=a.$4
break
default:s=null}if(s!=null)return s.bind(a)
return function(c,d,e){return function(f,g,h,i){return e(c,d,f,g,h,i)}}(a,b,A.iV)},
hu(a2){var s,r,q,p,o,n,m,l,k,j,i=a2.co,h=a2.iS,g=a2.iI,f=a2.nDA,e=a2.aI,d=a2.fs,c=a2.cs,b=d[0],a=c[0],a0=i[b],a1=a2.fT
a1.toString
s=h?Object.create(new A.ch().constructor.prototype):Object.create(new A.aP(null,null).constructor.prototype)
s.$initialize=s.constructor
r=h?function static_tear_off(){this.$initialize()}:function tear_off(a3,a4){this.$initialize(a3,a4)}
s.constructor=r
r.prototype=s
s.$_name=b
s.$_target=a0
q=!h
if(q)p=A.f9(b,a0,g,f)
else{s.$static_name=b
p=a0}s.$S=A.hq(a1,h,g)
s[a]=p
for(o=p,n=1;n<d.length;++n){m=d[n]
if(typeof m=="string"){l=i[m]
k=m
m=l}else k=""
j=c[n]
if(j!=null){if(q)m=A.f9(k,m,g,f)
s[j]=m}if(n===e)o=m}s.$C=o
s.$R=a2.rC
s.$D=a2.dV
return r},
hq(a,b,c){if(typeof a=="number")return a
if(typeof a=="string"){if(b)throw A.b("Cannot compute signature for static tearoff.")
return function(d,e){return function(){return e(this,d)}}(a,A.ho)}throw A.b("Error in functionType of tearoff")},
hr(a,b,c,d){var s=A.f8
switch(b?-1:a){case 0:return function(e,f){return function(){return f(this)[e]()}}(c,s)
case 1:return function(e,f){return function(g){return f(this)[e](g)}}(c,s)
case 2:return function(e,f){return function(g,h){return f(this)[e](g,h)}}(c,s)
case 3:return function(e,f){return function(g,h,i){return f(this)[e](g,h,i)}}(c,s)
case 4:return function(e,f){return function(g,h,i,j){return f(this)[e](g,h,i,j)}}(c,s)
case 5:return function(e,f){return function(g,h,i,j,k){return f(this)[e](g,h,i,j,k)}}(c,s)
default:return function(e,f){return function(){return e.apply(f(this),arguments)}}(d,s)}},
f9(a,b,c,d){if(c)return A.ht(a,b,d)
return A.hr(b.length,d,a,b)},
hs(a,b,c,d){var s=A.f8,r=A.hp
switch(b?-1:a){case 0:throw A.b(new A.cg("Intercepted function with no arguments."))
case 1:return function(e,f,g){return function(){return f(this)[e](g(this))}}(c,r,s)
case 2:return function(e,f,g){return function(h){return f(this)[e](g(this),h)}}(c,r,s)
case 3:return function(e,f,g){return function(h,i){return f(this)[e](g(this),h,i)}}(c,r,s)
case 4:return function(e,f,g){return function(h,i,j){return f(this)[e](g(this),h,i,j)}}(c,r,s)
case 5:return function(e,f,g){return function(h,i,j,k){return f(this)[e](g(this),h,i,j,k)}}(c,r,s)
case 6:return function(e,f,g){return function(h,i,j,k,l){return f(this)[e](g(this),h,i,j,k,l)}}(c,r,s)
default:return function(e,f,g){return function(){var q=[g(this)]
Array.prototype.push.apply(q,arguments)
return e.apply(f(this),q)}}(d,r,s)}},
ht(a,b,c){var s,r
if($.f6==null)$.f6=A.f5("interceptor")
if($.f7==null)$.f7=A.f5("receiver")
s=b.length
r=A.hs(s,c,a,b)
return r},
eT(a){return A.hu(a)},
ho(a,b){return A.dF(v.typeUniverse,A.aK(a.a),b)},
f8(a){return a.a},
hp(a){return a.b},
f5(a){var s,r,q,p=new A.aP("receiver","interceptor"),o=Object.getOwnPropertyNames(p)
o.$flags=1
s=o
for(o=s.length,r=0;r<o;++r){q=s[r]
if(p[q]===a)return q}throw A.b(A.I("Field name "+a+" not found.",null))},
ei(a){return v.getIsolateTag(a)},
jL(a){var s,r,q,p,o,n=A.G($.fZ.$1(a)),m=$.ee[n]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.em[n]
if(s!=null)return s
r=v.interceptorsByTag[n]
if(r==null){q=A.bL($.fS.$2(a,n))
if(q!=null){m=$.ee[q]
if(m!=null){Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}s=$.em[q]
if(s!=null)return s
r=v.interceptorsByTag[q]
n=q}}if(r==null)return null
s=r.prototype
p=n[0]
if(p==="!"){m=A.er(s)
$.ee[n]=m
Object.defineProperty(a,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
return m.i}if(p==="~"){$.em[n]=s
return s}if(p==="-"){o=A.er(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}if(p==="+")return A.h2(a,s)
if(p==="*")throw A.b(A.fq(n))
if(v.leafTags[n]===true){o=A.er(s)
Object.defineProperty(Object.getPrototypeOf(a),v.dispatchPropertyName,{value:o,enumerable:false,writable:true,configurable:true})
return o.i}else return A.h2(a,s)},
h2(a,b){var s=Object.getPrototypeOf(a)
Object.defineProperty(s,v.dispatchPropertyName,{value:J.f_(b,s,null,null),enumerable:false,writable:true,configurable:true})
return b},
er(a){return J.f_(a,!1,null,!!a.$iT)},
jN(a,b,c){var s=b.prototype
if(v.leafTags[a]===true)return A.er(s)
else return J.f_(s,c,null,null)},
jG(){if(!0===$.eY)return
$.eY=!0
A.jH()},
jH(){var s,r,q,p,o,n,m,l
$.ee=Object.create(null)
$.em=Object.create(null)
A.jF()
s=v.interceptorsByTag
r=Object.getOwnPropertyNames(s)
if(typeof window!="undefined"){window
q=function(){}
for(p=0;p<r.length;++p){o=r[p]
n=$.h3.$1(o)
if(n!=null){m=A.jN(o,s[o],n)
if(m!=null){Object.defineProperty(n,v.dispatchPropertyName,{value:m,enumerable:false,writable:true,configurable:true})
q.prototype=n}}}}for(p=0;p<r.length;++p){o=r[p]
if(/^[A-Za-z_]/.test(o)){l=s[o]
s["!"+o]=l
s["~"+o]=l
s["-"+o]=l
s["+"+o]=l
s["*"+o]=l}}},
jF(){var s,r,q,p,o,n,m=B.p()
m=A.b_(B.q,A.b_(B.r,A.b_(B.l,A.b_(B.l,A.b_(B.t,A.b_(B.u,A.b_(B.v(B.k),m)))))))
if(typeof dartNativeDispatchHooksTransformer!="undefined"){s=dartNativeDispatchHooksTransformer
if(typeof s=="function")s=[s]
if(Array.isArray(s))for(r=0;r<s.length;++r){q=s[r]
if(typeof q=="function")m=q(m)||m}}p=m.getTag
o=m.getUnknownTag
n=m.prototypeForTag
$.fZ=new A.ej(p)
$.fS=new A.ek(o)
$.h3=new A.el(n)},
b_(a,b){return a(b)||b},
jx(a,b){var s=b.length,r=v.rttc[""+s+";"+a]
if(r==null)return null
if(s===0)return r
if(s===r.length)return r.apply(null,b)
return r(b)},
hF(a,b,c,d,e,f){var s=function(g,h){try{return new RegExp(g,h)}catch(r){return r}}(a,""+""+""+""+f)
if(s instanceof RegExp)return s
throw A.b(A.l("Illegal RegExp pattern ("+String(s)+")",a))},
jQ(a){if(/[[\]{}()*+?.\\^$|]/.test(a))return a.replace(/[[\]{}()*+?.\\^$|]/g,"\\$&")
return a},
bZ:function bZ(){},
aA:function aA(a,b){this.a=a
this.$ti=b},
bp:function bp(){},
d7:function d7(a,b,c,d,e,f){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e
_.f=f},
bm:function bm(){},
c3:function c3(a,b,c){this.a=a
this.b=b
this.c=c},
cm:function cm(a){this.a=a},
cV:function cV(a){this.a=a},
b5:function b5(a,b){this.a=a
this.b=b},
bG:function bG(a){this.a=a
this.b=null},
L:function L(){},
bT:function bT(){},
bU:function bU(){},
cj:function cj(){},
ch:function ch(){},
aP:function aP(a,b){this.a=a
this.b=b},
cg:function cg(a){this.a=a},
aB:function aB(a){var _=this
_.a=0
_.f=_.e=_.d=_.c=_.b=null
_.r=0
_.$ti=a},
cK:function cK(a){this.a=a},
cS:function cS(a,b){this.a=a
this.b=b
this.c=null},
bg:function bg(a,b){this.a=a
this.$ti=b},
bf:function bf(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=null
_.$ti=d},
ej:function ej(a){this.a=a},
ek:function ek(a){this.a=a},
el:function el(a){this.a=a},
cI:function cI(a,b){this.a=a
this.b=b},
iL(a){return a},
aS:function aS(){},
bk:function bk(){},
c4:function c4(){},
aT:function aT(){},
bi:function bi(){},
bj:function bj(){},
c5:function c5(){},
c6:function c6(){},
c7:function c7(){},
c8:function c8(){},
c9:function c9(){},
ca:function ca(){},
cb:function cb(){},
bl:function bl(){},
cc:function cc(){},
bC:function bC(){},
bD:function bD(){},
bE:function bE(){},
bF:function bF(){},
eG(a,b){var s=b.c
return s==null?b.c=A.bI(a,"az",[b.x]):s},
fm(a){var s=a.w
if(s===6||s===7)return A.fm(a.x)
return s===11||s===12},
hZ(a){return a.as},
eh(a){return A.dE(v.typeUniverse,a,!1)},
jJ(a,b){var s,r,q,p,o
if(a==null)return null
s=b.y
r=a.Q
if(r==null)r=a.Q=new Map()
q=b.as
p=r.get(q)
if(p!=null)return p
o=A.ax(v.typeUniverse,a.x,s,0)
r.set(q,o)
return o},
ax(a1,a2,a3,a4){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0=a2.w
switch(a0){case 5:case 1:case 2:case 3:case 4:return a2
case 6:s=a2.x
r=A.ax(a1,s,a3,a4)
if(r===s)return a2
return A.fz(a1,r,!0)
case 7:s=a2.x
r=A.ax(a1,s,a3,a4)
if(r===s)return a2
return A.fy(a1,r,!0)
case 8:q=a2.y
p=A.aZ(a1,q,a3,a4)
if(p===q)return a2
return A.bI(a1,a2.x,p)
case 9:o=a2.x
n=A.ax(a1,o,a3,a4)
m=a2.y
l=A.aZ(a1,m,a3,a4)
if(n===o&&l===m)return a2
return A.eK(a1,n,l)
case 10:k=a2.x
j=a2.y
i=A.aZ(a1,j,a3,a4)
if(i===j)return a2
return A.fA(a1,k,i)
case 11:h=a2.x
g=A.ax(a1,h,a3,a4)
f=a2.y
e=A.ji(a1,f,a3,a4)
if(g===h&&e===f)return a2
return A.fx(a1,g,e)
case 12:d=a2.y
a4+=d.length
c=A.aZ(a1,d,a3,a4)
o=a2.x
n=A.ax(a1,o,a3,a4)
if(c===d&&n===o)return a2
return A.eL(a1,n,c,!0)
case 13:b=a2.x
if(b<a4)return a2
a=a3[b-a4]
if(a==null)return a2
return a
default:throw A.b(A.bS("Attempted to substitute unexpected RTI kind "+a0))}},
aZ(a,b,c,d){var s,r,q,p,o=b.length,n=A.dG(o)
for(s=!1,r=0;r<o;++r){q=b[r]
p=A.ax(a,q,c,d)
if(p!==q)s=!0
n[r]=p}return s?n:b},
jj(a,b,c,d){var s,r,q,p,o,n,m=b.length,l=A.dG(m)
for(s=!1,r=0;r<m;r+=3){q=b[r]
p=b[r+1]
o=b[r+2]
n=A.ax(a,o,c,d)
if(n!==o)s=!0
l.splice(r,3,q,p,n)}return s?l:b},
ji(a,b,c,d){var s,r=b.a,q=A.aZ(a,r,c,d),p=b.b,o=A.aZ(a,p,c,d),n=b.c,m=A.jj(a,n,c,d)
if(q===r&&o===p&&m===n)return b
s=new A.ct()
s.a=q
s.b=o
s.c=m
return s},
i(a,b){a[v.arrayRti]=b
return a},
ec(a){var s=a.$S
if(s!=null){if(typeof s=="number")return A.jD(s)
return a.$S()}return null},
jI(a,b){var s
if(A.fm(b))if(a instanceof A.L){s=A.ec(a)
if(s!=null)return s}return A.aK(a)},
aK(a){if(a instanceof A.c)return A.aj(a)
if(Array.isArray(a))return A.R(a)
return A.eP(J.aI(a))},
R(a){var s=a[v.arrayRti],r=t.b
if(s==null)return r
if(s.constructor!==r.constructor)return r
return s},
aj(a){var s=a.$ti
return s!=null?s:A.eP(a)},
eP(a){var s=a.constructor,r=s.$ccache
if(r!=null)return r
return A.iS(a,s)},
iS(a,b){var s=a instanceof A.L?Object.getPrototypeOf(Object.getPrototypeOf(a)).constructor:b,r=A.iw(v.typeUniverse,s.name)
b.$ccache=r
return r},
jD(a){var s,r=v.types,q=r[a]
if(typeof q=="string"){s=A.dE(v.typeUniverse,q,!1)
r[a]=s
return s}return q},
jC(a){return A.am(A.aj(a))},
eX(a){var s=A.ec(a)
return A.am(s==null?A.aK(a):s)},
jh(a){var s=a instanceof A.L?A.ec(a):null
if(s!=null)return s
if(t.bW.b(a))return J.hl(a).a
if(Array.isArray(a))return A.R(a)
return A.aK(a)},
am(a){var s=a.r
return s==null?a.r=new A.dD(a):s},
a3(a){return A.am(A.dE(v.typeUniverse,a,!1))},
iR(a){var s=this
s.b=A.jf(s)
return s.b(a)},
jf(a){var s,r,q,p,o
if(a===t.K)return A.j0
if(A.aL(a))return A.j4
s=a.w
if(s===6)return A.iP
if(s===1)return A.fM
if(s===7)return A.iW
r=A.je(a)
if(r!=null)return r
if(s===8){q=a.x
if(a.y.every(A.aL)){a.f="$i"+q
if(q==="n")return A.iZ
if(a===t.m)return A.iY
return A.j3}}else if(s===10){p=A.jx(a.x,a.y)
o=p==null?A.fM:p
return o==null?A.bK(o):o}return A.iN},
je(a){if(a.w===8){if(a===t.S)return A.fK
if(a===t.i||a===t.n)return A.j_
if(a===t.N)return A.j2
if(a===t.y)return A.dV}return null},
iQ(a){var s=this,r=A.iM
if(A.aL(s))r=A.iC
else if(s===t.K)r=A.bK
else if(A.b0(s)){r=A.iO
if(s===t.a3)r=A.iA
else if(s===t.w)r=A.bL
else if(s===t.cG)r=A.iy
else if(s===t.ae)r=A.fE
else if(s===t.dd)r=A.iz
else if(s===t.b1)r=A.J}else if(s===t.S)r=A.E
else if(s===t.N)r=A.G
else if(s===t.y)r=A.cw
else if(s===t.n)r=A.iB
else if(s===t.i)r=A.a6
else if(s===t.m)r=A.e
s.a=r
return s.a(a)},
iN(a){var s=this
if(a==null)return A.b0(s)
return A.h_(v.typeUniverse,A.jI(a,s),s)},
iP(a){if(a==null)return!0
return this.x.b(a)},
j3(a){var s,r=this
if(a==null)return A.b0(r)
s=r.f
if(a instanceof A.c)return!!a[s]
return!!J.aI(a)[s]},
iZ(a){var s,r=this
if(a==null)return A.b0(r)
if(typeof a!="object")return!1
if(Array.isArray(a))return!0
s=r.f
if(a instanceof A.c)return!!a[s]
return!!J.aI(a)[s]},
iY(a){var s=this
if(a==null)return!1
if(typeof a=="object"){if(a instanceof A.c)return!!a[s.f]
return!0}if(typeof a=="function")return!0
return!1},
fL(a){if(typeof a=="object"){if(a instanceof A.c)return t.m.b(a)
return!0}if(typeof a=="function")return!0
return!1},
iM(a){var s=this
if(a==null){if(A.b0(s))return a}else if(s.b(a))return a
throw A.B(A.fG(a,s),new Error())},
iO(a){var s=this
if(a==null||s.b(a))return a
throw A.B(A.fG(a,s),new Error())},
fG(a,b){return new A.aX("TypeError: "+A.fs(a,A.N(b,null)))},
fU(a,b,c,d){if(A.h_(v.typeUniverse,a,b))return a
throw A.B(A.im("The type argument '"+A.N(a,null)+"' is not a subtype of the type variable bound '"+A.N(b,null)+"' of type variable '"+c+"' in '"+d+"'."),new Error())},
fs(a,b){return A.cB(a)+": type '"+A.N(A.jh(a),null)+"' is not a subtype of type '"+b+"'"},
im(a){return new A.aX("TypeError: "+a)},
Y(a,b){return new A.aX("TypeError: "+A.fs(a,b))},
iW(a){var s=this
return s.x.b(a)||A.eG(v.typeUniverse,s).b(a)},
j0(a){return a!=null},
bK(a){if(a!=null)return a
throw A.B(A.Y(a,"Object"),new Error())},
j4(a){return!0},
iC(a){return a},
fM(a){return!1},
dV(a){return!0===a||!1===a},
cw(a){if(!0===a)return!0
if(!1===a)return!1
throw A.B(A.Y(a,"bool"),new Error())},
iy(a){if(!0===a)return!0
if(!1===a)return!1
if(a==null)return a
throw A.B(A.Y(a,"bool?"),new Error())},
a6(a){if(typeof a=="number")return a
throw A.B(A.Y(a,"double"),new Error())},
iz(a){if(typeof a=="number")return a
if(a==null)return a
throw A.B(A.Y(a,"double?"),new Error())},
fK(a){return typeof a=="number"&&Math.floor(a)===a},
E(a){if(typeof a=="number"&&Math.floor(a)===a)return a
throw A.B(A.Y(a,"int"),new Error())},
iA(a){if(typeof a=="number"&&Math.floor(a)===a)return a
if(a==null)return a
throw A.B(A.Y(a,"int?"),new Error())},
j_(a){return typeof a=="number"},
iB(a){if(typeof a=="number")return a
throw A.B(A.Y(a,"num"),new Error())},
fE(a){if(typeof a=="number")return a
if(a==null)return a
throw A.B(A.Y(a,"num?"),new Error())},
j2(a){return typeof a=="string"},
G(a){if(typeof a=="string")return a
throw A.B(A.Y(a,"String"),new Error())},
bL(a){if(typeof a=="string")return a
if(a==null)return a
throw A.B(A.Y(a,"String?"),new Error())},
e(a){if(A.fL(a))return a
throw A.B(A.Y(a,"JSObject"),new Error())},
J(a){if(a==null)return a
if(A.fL(a))return a
throw A.B(A.Y(a,"JSObject?"),new Error())},
fQ(a,b){var s,r,q
for(s="",r="",q=0;q<a.length;++q,r=", ")s+=r+A.N(a[q],b)
return s},
ja(a,b){var s,r,q,p,o,n,m=a.x,l=a.y
if(""===m)return"("+A.fQ(l,b)+")"
s=l.length
r=m.split(",")
q=r.length-s
for(p="(",o="",n=0;n<s;++n,o=", "){p+=o
if(q===0)p+="{"
p+=A.N(l[n],b)
if(q>=0)p+=" "+r[q];++q}return p+"})"},
fH(a3,a4,a5){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1=", ",a2=null
if(a5!=null){s=a5.length
if(a4==null)a4=A.i([],t.s)
else a2=a4.length
r=a4.length
for(q=s;q>0;--q)B.a.l(a4,"T"+(r+q))
for(p=t.X,o="<",n="",q=0;q<s;++q,n=a1){m=a4.length
l=m-1-q
if(!(l>=0))return A.t(a4,l)
o=o+n+a4[l]
k=a5[q]
j=k.w
if(!(j===2||j===3||j===4||j===5||k===p))o+=" extends "+A.N(k,a4)}o+=">"}else o=""
p=a3.x
i=a3.y
h=i.a
g=h.length
f=i.b
e=f.length
d=i.c
c=d.length
b=A.N(p,a4)
for(a="",a0="",q=0;q<g;++q,a0=a1)a+=a0+A.N(h[q],a4)
if(e>0){a+=a0+"["
for(a0="",q=0;q<e;++q,a0=a1)a+=a0+A.N(f[q],a4)
a+="]"}if(c>0){a+=a0+"{"
for(a0="",q=0;q<c;q+=3,a0=a1){a+=a0
if(d[q+1])a+="required "
a+=A.N(d[q+2],a4)+" "+d[q]}a+="}"}if(a2!=null){a4.toString
a4.length=a2}return o+"("+a+") => "+b},
N(a,b){var s,r,q,p,o,n,m,l=a.w
if(l===5)return"erased"
if(l===2)return"dynamic"
if(l===3)return"void"
if(l===1)return"Never"
if(l===4)return"any"
if(l===6){s=a.x
r=A.N(s,b)
q=s.w
return(q===11||q===12?"("+r+")":r)+"?"}if(l===7)return"FutureOr<"+A.N(a.x,b)+">"
if(l===8){p=A.jl(a.x)
o=a.y
return o.length>0?p+("<"+A.fQ(o,b)+">"):p}if(l===10)return A.ja(a,b)
if(l===11)return A.fH(a,b,null)
if(l===12)return A.fH(a.x,b,a.y)
if(l===13){n=a.x
m=b.length
n=m-1-n
if(!(n>=0&&n<m))return A.t(b,n)
return b[n]}return"?"},
jl(a){var s=A.h6(a)
if(s!=null)return s
return"minified:"+a},
ix(a,b){var s=a.tR[b]
while(typeof s=="string")s=a.tR[s]
return s},
iw(a,b){var s,r,q,p,o,n=a.eT,m=n[b]
if(m==null)return A.dE(a,b,!1)
else if(typeof m=="number"){s=m
r=A.bJ(a,5,"#")
q=A.dG(s)
for(p=0;p<s;++p)q[p]=r
o=A.bI(a,b,q)
n[b]=o
return o}else return m},
iu(a,b){return A.fC(a.tR,b)},
it(a,b){return A.fC(a.eT,b)},
dE(a,b,c){var s,r=a.eC,q=r.get(b)
if(q!=null)return q
s=A.fB(a,null,b,!1)
r.set(b,s)
return s},
dF(a,b,c){var s,r,q=b.z
if(q==null)q=b.z=new Map()
s=q.get(c)
if(s!=null)return s
r=A.fB(a,b,c,!0)
q.set(c,r)
return r},
iv(a,b,c){var s,r,q,p=b.Q
if(p==null)p=b.Q=new Map()
s=c.as
r=p.get(s)
if(r!=null)return r
q=A.eK(a,b,c.w===9?c.y:[c])
p.set(s,q)
return q},
fB(a,b,c,d){return A.ij(A.ic(a,b,c,d))},
aw(a,b){b.a=A.iQ
b.b=A.iR
return b},
bJ(a,b,c){var s,r,q=a.eC.get(c)
if(q!=null)return q
s=new A.a1(null,null)
s.w=b
s.as=c
r=A.aw(a,s)
a.eC.set(c,r)
return r},
fz(a,b,c){var s,r=b.as+"?",q=a.eC.get(r)
if(q!=null)return q
s=A.ir(a,b,r,c)
a.eC.set(r,s)
return s},
ir(a,b,c,d){var s,r,q
if(d){s=b.w
r=!0
if(!A.aL(b))if(!(b===t.P||b===t.T))if(s!==6)r=s===7&&A.b0(b.x)
if(r)return b
else if(s===1)return t.P}q=new A.a1(null,null)
q.w=6
q.x=b
q.as=c
return A.aw(a,q)},
fy(a,b,c){var s,r=b.as+"/",q=a.eC.get(r)
if(q!=null)return q
s=A.ip(a,b,r,c)
a.eC.set(r,s)
return s},
ip(a,b,c,d){var s,r
if(d){s=b.w
if(A.aL(b)||b===t.K)return b
else if(s===1)return A.bI(a,"az",[b])
else if(b===t.P||b===t.T)return t.bc}r=new A.a1(null,null)
r.w=7
r.x=b
r.as=c
return A.aw(a,r)},
is(a,b){var s,r,q=""+b+"^",p=a.eC.get(q)
if(p!=null)return p
s=new A.a1(null,null)
s.w=13
s.x=b
s.as=q
r=A.aw(a,s)
a.eC.set(q,r)
return r},
bH(a){var s,r,q,p=a.length
for(s="",r="",q=0;q<p;++q,r=",")s+=r+a[q].as
return s},
io(a){var s,r,q,p,o,n=a.length
for(s="",r="",q=0;q<n;q+=3,r=","){p=a[q]
o=a[q+1]?"!":":"
s+=r+p+o+a[q+2].as}return s},
bI(a,b,c){var s,r,q,p=b
if(c.length>0)p+="<"+A.bH(c)+">"
s=a.eC.get(p)
if(s!=null)return s
r=new A.a1(null,null)
r.w=8
r.x=b
r.y=c
if(c.length>0)r.c=c[0]
r.as=p
q=A.aw(a,r)
a.eC.set(p,q)
return q},
eK(a,b,c){var s,r,q,p,o,n
if(b.w===9){s=b.x
r=b.y.concat(c)}else{r=c
s=b}q=s.as+(";<"+A.bH(r)+">")
p=a.eC.get(q)
if(p!=null)return p
o=new A.a1(null,null)
o.w=9
o.x=s
o.y=r
o.as=q
n=A.aw(a,o)
a.eC.set(q,n)
return n},
fA(a,b,c){var s,r,q="+"+(b+"("+A.bH(c)+")"),p=a.eC.get(q)
if(p!=null)return p
s=new A.a1(null,null)
s.w=10
s.x=b
s.y=c
s.as=q
r=A.aw(a,s)
a.eC.set(q,r)
return r},
fx(a,b,c){var s,r,q,p,o,n=b.as,m=c.a,l=m.length,k=c.b,j=k.length,i=c.c,h=i.length,g="("+A.bH(m)
if(j>0){s=l>0?",":""
g+=s+"["+A.bH(k)+"]"}if(h>0){s=l>0?",":""
g+=s+"{"+A.io(i)+"}"}r=n+(g+")")
q=a.eC.get(r)
if(q!=null)return q
p=new A.a1(null,null)
p.w=11
p.x=b
p.y=c
p.as=r
o=A.aw(a,p)
a.eC.set(r,o)
return o},
eL(a,b,c,d){var s,r=b.as+("<"+A.bH(c)+">"),q=a.eC.get(r)
if(q!=null)return q
s=A.iq(a,b,c,r,d)
a.eC.set(r,s)
return s},
iq(a,b,c,d,e){var s,r,q,p,o,n,m,l
if(e){s=c.length
r=A.dG(s)
for(q=0,p=0;p<s;++p){o=c[p]
if(o.w===1){r[p]=o;++q}}if(q>0){n=A.ax(a,b,r,0)
m=A.aZ(a,c,r,0)
return A.eL(a,n,m,c!==m)}}l=new A.a1(null,null)
l.w=12
l.x=b
l.y=c
l.as=d
return A.aw(a,l)},
ic(a,b,c,d){return{u:a,e:b,r:c,s:[],p:0,n:d}},
ij(a){var s,r,q,p,o,n,m,l=a.r,k=a.s
for(s=l.length,r=0;r<s;){q=l.charCodeAt(r)
if(q>=48&&q<=57)r=A.ie(r+1,q,l,k)
else if((((q|32)>>>0)-97&65535)<26||q===95||q===36||q===124)r=A.fv(a,r,l,k,!1)
else if(q===46)r=A.fv(a,r,l,k,!0)
else{++r
switch(q){case 44:break
case 58:k.push(!1)
break
case 33:k.push(!0)
break
case 59:k.push(A.aG(a.u,a.e,k.pop()))
break
case 94:k.push(A.is(a.u,k.pop()))
break
case 35:k.push(A.bJ(a.u,5,"#"))
break
case 64:k.push(A.bJ(a.u,2,"@"))
break
case 126:k.push(A.bJ(a.u,3,"~"))
break
case 60:k.push(a.p)
a.p=k.length
break
case 62:A.ih(a,k)
break
case 38:A.ig(a,k)
break
case 63:p=a.u
k.push(A.fz(p,A.aG(p,a.e,k.pop()),a.n))
break
case 47:p=a.u
k.push(A.fy(p,A.aG(p,a.e,k.pop()),a.n))
break
case 40:k.push(-3)
k.push(a.p)
a.p=k.length
break
case 41:A.id(a,k)
break
case 91:k.push(a.p)
a.p=k.length
break
case 93:o=k.splice(a.p)
A.fw(a.u,a.e,o)
a.p=k.pop()
k.push(o)
k.push(-1)
break
case 123:k.push(a.p)
a.p=k.length
break
case 125:o=k.splice(a.p)
A.ik(a.u,a.e,o)
a.p=k.pop()
k.push(o)
k.push(-2)
break
case 43:n=l.indexOf("(",r)
k.push(l.substring(r,n))
k.push(-4)
k.push(a.p)
a.p=k.length
r=n+1
break
default:throw"Bad character "+q}}}m=k.pop()
return A.aG(a.u,a.e,m)},
ie(a,b,c,d){var s,r,q=b-48
for(s=c.length;a<s;++a){r=c.charCodeAt(a)
if(!(r>=48&&r<=57))break
q=q*10+(r-48)}d.push(q)
return a},
fv(a,b,c,d,e){var s,r,q,p,o,n,m=b+1
for(s=c.length;m<s;++m){r=c.charCodeAt(m)
if(r===46){if(e)break
e=!0}else{if(!((((r|32)>>>0)-97&65535)<26||r===95||r===36||r===124))q=r>=48&&r<=57
else q=!0
if(!q)break}}p=c.substring(b,m)
if(e){s=a.u
o=a.e
if(o.w===9)o=o.x
n=A.ix(s,o.x)[p]
if(n==null)A.m('No "'+p+'" in "'+A.hZ(o)+'"')
d.push(A.dF(s,o,n))}else d.push(p)
return m},
ih(a,b){var s,r=a.u,q=A.fu(a,b),p=b.pop()
if(typeof p=="string")b.push(A.bI(r,p,q))
else{s=A.aG(r,a.e,p)
switch(s.w){case 11:b.push(A.eL(r,s,q,a.n))
break
default:b.push(A.eK(r,s,q))
break}}},
id(a,b){var s,r,q,p=a.u,o=b.pop(),n=null,m=null
if(typeof o=="number")switch(o){case-1:n=b.pop()
break
case-2:m=b.pop()
break
default:b.push(o)
break}else b.push(o)
s=A.fu(a,b)
o=b.pop()
switch(o){case-3:o=b.pop()
if(n==null)n=p.sEA
if(m==null)m=p.sEA
r=A.aG(p,a.e,o)
q=new A.ct()
q.a=s
q.b=n
q.c=m
b.push(A.fx(p,r,q))
return
case-4:b.push(A.fA(p,b.pop(),s))
return
default:throw A.b(A.bS("Unexpected state under `()`: "+A.h(o)))}},
ig(a,b){var s=b.pop()
if(0===s){b.push(A.bJ(a.u,1,"0&"))
return}if(1===s){b.push(A.bJ(a.u,4,"1&"))
return}throw A.b(A.bS("Unexpected extended operation "+A.h(s)))},
fu(a,b){var s=b.splice(a.p)
A.fw(a.u,a.e,s)
a.p=b.pop()
return s},
aG(a,b,c){if(typeof c=="string")return A.bI(a,c,a.sEA)
else if(typeof c=="number"){b.toString
return A.ii(a,b,c)}else return c},
fw(a,b,c){var s,r=c.length
for(s=0;s<r;++s)c[s]=A.aG(a,b,c[s])},
ik(a,b,c){var s,r=c.length
for(s=2;s<r;s+=3)c[s]=A.aG(a,b,c[s])},
ii(a,b,c){var s,r,q=b.w
if(q===9){if(c===0)return b.x
s=b.y
r=s.length
if(c<=r)return s[c-1]
c-=r
b=b.x
q=b.w}else if(c===0)return b
if(q!==8)throw A.b(A.bS("Indexed base must be an interface type"))
s=b.y
if(c<=s.length)return s[c-1]
throw A.b(A.bS("Bad index "+c+" for "+b.j(0)))},
h_(a,b,c){var s,r=b.d
if(r==null)r=b.d=new Map()
s=r.get(c)
if(s==null){s=A.D(a,b,null,c,null)
r.set(c,s)}return s},
D(a,b,c,d,e){var s,r,q,p,o,n,m,l,k,j,i
if(b===d)return!0
if(A.aL(d))return!0
s=b.w
if(s===4)return!0
if(A.aL(b))return!1
if(b.w===1)return!0
r=s===13
if(r)if(A.D(a,c[b.x],c,d,e))return!0
q=d.w
p=t.P
if(b===p||b===t.T){if(q===7)return A.D(a,b,c,d.x,e)
return d===p||d===t.T||q===6}if(d===t.K){if(s===7)return A.D(a,b.x,c,d,e)
return s!==6}if(s===7){if(!A.D(a,b.x,c,d,e))return!1
return A.D(a,A.eG(a,b),c,d,e)}if(s===6)return A.D(a,p,c,d,e)&&A.D(a,b.x,c,d,e)
if(q===7){if(A.D(a,b,c,d.x,e))return!0
return A.D(a,b,c,A.eG(a,d),e)}if(q===6)return A.D(a,b,c,p,e)||A.D(a,b,c,d.x,e)
if(r)return!1
p=s!==11
if((!p||s===12)&&d===t.Z)return!0
o=s===10
if(o&&d===t.L)return!0
if(q===12){if(b===t.g)return!0
if(s!==12)return!1
n=b.y
m=d.y
l=n.length
if(l!==m.length)return!1
c=c==null?n:n.concat(c)
e=e==null?m:m.concat(e)
for(k=0;k<l;++k){j=n[k]
i=m[k]
if(!A.D(a,j,c,i,e)||!A.D(a,i,e,j,c))return!1}return A.fJ(a,b.x,c,d.x,e)}if(q===11){if(b===t.g)return!0
if(p)return!1
return A.fJ(a,b,c,d,e)}if(s===8){if(q!==8)return!1
return A.iX(a,b,c,d,e)}if(o&&q===10)return A.j1(a,b,c,d,e)
return!1},
fJ(a3,a4,a5,a6,a7){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1,a2
if(!A.D(a3,a4.x,a5,a6.x,a7))return!1
s=a4.y
r=a6.y
q=s.a
p=r.a
o=q.length
n=p.length
if(o>n)return!1
m=n-o
l=s.b
k=r.b
j=l.length
i=k.length
if(o+j<n+i)return!1
for(h=0;h<o;++h){g=q[h]
if(!A.D(a3,p[h],a7,g,a5))return!1}for(h=0;h<m;++h){g=l[h]
if(!A.D(a3,p[o+h],a7,g,a5))return!1}for(h=0;h<i;++h){g=l[m+h]
if(!A.D(a3,k[h],a7,g,a5))return!1}f=s.c
e=r.c
d=f.length
c=e.length
for(b=0,a=0;a<c;a+=3){a0=e[a]
for(;;){if(b>=d)return!1
a1=f[b]
b+=3
if(a0<a1)return!1
a2=f[b-2]
if(a1<a0){if(a2)return!1
continue}g=e[a+1]
if(a2&&!g)return!1
g=f[b-1]
if(!A.D(a3,e[a+2],a7,g,a5))return!1
break}}while(b<d){if(f[b+1])return!1
b+=3}return!0},
iX(a,b,c,d,e){var s,r,q,p,o,n=b.x,m=d.x
while(n!==m){s=a.tR[n]
if(s==null)return!1
if(typeof s=="string"){n=s
continue}r=s[m]
if(r==null)return!1
q=r.length
p=q>0?new Array(q):v.typeUniverse.sEA
for(o=0;o<q;++o)p[o]=A.dF(a,b,r[o])
return A.fD(a,p,null,c,d.y,e)}return A.fD(a,b.y,null,c,d.y,e)},
fD(a,b,c,d,e,f){var s,r=b.length
for(s=0;s<r;++s)if(!A.D(a,b[s],d,e[s],f))return!1
return!0},
j1(a,b,c,d,e){var s,r=b.y,q=d.y,p=r.length
if(p!==q.length)return!1
if(b.x!==d.x)return!1
for(s=0;s<p;++s)if(!A.D(a,r[s],c,q[s],e))return!1
return!0},
b0(a){var s=a.w,r=!0
if(!(a===t.P||a===t.T))if(!A.aL(a))if(s!==6)r=s===7&&A.b0(a.x)
return r},
aL(a){var s=a.w
return s===2||s===3||s===4||s===5||a===t.X},
fC(a,b){var s,r,q=Object.keys(b),p=q.length
for(s=0;s<p;++s){r=q[s]
a[r]=b[r]}},
dG(a){return a>0?new Array(a):v.typeUniverse.sEA},
a1:function a1(a,b){var _=this
_.a=a
_.b=b
_.r=_.f=_.d=_.c=null
_.w=0
_.as=_.Q=_.z=_.y=_.x=null},
ct:function ct(){this.c=this.b=this.a=null},
dD:function dD(a){this.a=a},
cs:function cs(){},
aX:function aX(a){this.a=a},
i7(){var s,r,q
if(self.scheduleImmediate!=null)return A.jp()
if(self.MutationObserver!=null&&self.document!=null){s={}
r=self.document.createElement("div")
q=self.document.createElement("span")
s.a=null
new self.MutationObserver(A.bO(new A.dk(s),1)).observe(r,{childList:true})
return new A.dj(s,r,q)}else if(self.setImmediate!=null)return A.jq()
return A.jr()},
i8(a){self.scheduleImmediate(A.bO(new A.dl(t.M.a(a)),0))},
i9(a){self.setImmediate(A.bO(new A.dm(t.M.a(a)),0))},
ia(a){t.M.a(a)
A.il(0,a)},
il(a,b){var s=new A.dB()
s.aM(a,b)
return s},
ak(a){return new A.co(new A.z($.v,a.h("z<0>")),a.h("co<0>"))},
ai(a,b){a.$2(0,null)
b.b=!0
return b.a},
H(a,b){A.iD(a,b)},
ah(a,b){b.ab(a)},
ag(a,b){b.ac(A.aM(a),A.aJ(a))},
iD(a,b){var s,r,q=new A.dM(b),p=new A.dN(b)
if(a instanceof A.z)a.aA(q,p,t.z)
else{s=t.z
if(a instanceof A.z)a.ag(q,p,s)
else{r=new A.z($.v,t._)
r.a=8
r.c=a
r.aA(q,p,s)}}},
al(a){var s=function(b,c){return function(d,e){while(true){try{b(d,e)
break}catch(q){e=q
d=c}}}}(a,1),r=$.v
return r.aw(r,t.aS.a(new A.eb(s)),t.H,t.S,t.z)},
cz(a){var s
if(t.C.b(a)){s=a.gO()
if(s!=null)return s}return B.e},
iT(a,b){var s=$.v
if(s===B.d)return null
s.aT(s,a,b)
return null},
iU(a,b){if($.v!==B.d)A.iT(a,b)
if(b==null)if(t.C.b(a)){b=a.gO()
if(b==null){A.fk(a,B.e)
b=B.e}}else b=B.e
else if(t.C.b(a))A.fk(a,b)
return new A.W(a,b)},
eH(a,b,c){var s,r,q,p,o,n={},m=n.a=a
for(s=t._;r=m.a,(r&4)!==0;m=a){a=s.a(m.c)
n.a=a}if(m===b){s=A.i1()
b.a0(new A.W(new A.a4(!0,m,null,"Cannot complete a future with itself"),s))
return}q=b.a&1
s=m.a=r|q
if((s&24)===0){p=t.F.a(b.c)
b.a=b.a&1|4
b.c=m
m.av(p)
return}if(!c)if(b.c==null)m=(s&16)===0||q!==0
else m=!1
else m=!0
if(m){p=b.J()
b.S(n.a)
A.aF(b,p)
return}b.a^=2
o=b.b
o.K(o,new A.dt(n,b))},
aF(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e={},d=e.a=a
for(s=t.t,r=t.F;;){q={}
p=d.a
o=(p&16)===0
n=!o
if(b==null){if(n&&(p&1)===0){m=s.a(d.c)
d=d.b
d.a5(d,m.a,m.b)}return}q.a=b
l=b.a
for(d=b;l!=null;d=l,l=k){d.a=null
A.aF(e.a,d)
q.a=l
k=l.a}j=e.a.c
q.b=n
q.c=j
if(o){p=d.c
p=(p&1)!==0||(p&15)===8}else p=!0
if(p){i=d.b.b
h=$.v
if(h!==i)$.v=i
else h=null
d=d.c
if((d&15)===8)new A.dx(q,e,n).$0()
else if(o){if((d&1)!==0)new A.dw(q,j).$0()}else if((d&2)!==0)new A.dv(e,q).$0()
if(h!=null)$.v=h
d=q.c
if(d instanceof A.z){p=q.a.$ti
p=p.h("az<2>").b(d)||!p.y[1].b(d)}else p=!1
if(p){g=q.a.b
if((d.a&24)!==0){f=r.a(g.c)
g.c=null
b=g.T(f)
g.a=d.a&30|g.a&1
g.c=d.c
e.a=d
continue}else A.eH(d,g,!0)
return}}g=q.a.b
f=r.a(g.c)
g.c=null
b=g.T(f)
d=q.b
p=q.c
if(!d){g.$ti.c.a(p)
g.a=8
g.c=p}else{s.a(p)
g.a=g.a&1|16
g.c=p}e.a=g
d=g}},
fP(a,b){var s=t.Q
if(s.b(a))return b.aw(b,s.a(a),t.z,t.K,t.l)
s=t.v
if(s.b(a))return b.a9(b,s.a(a),t.z,t.K)
throw A.b(A.f4(a,"onError",u.c))},
j6(){var s,r
for(s=$.aY;s!=null;s=$.aY){$.bN=null
r=s.b
$.aY=r
if(r==null)$.bM=null
s.a.$0()}},
jg(){$.eQ=!0
try{A.j6()}finally{$.bN=null
$.eQ=!1
if($.aY!=null)$.f1().$1(A.fT())}},
fR(a){var s=new A.cp(a),r=$.bM
if(r==null){$.aY=$.bM=s
if(!$.eQ)$.f1().$1(A.fT())}else $.bM=r.b=s},
jd(a){var s,r,q,p=$.aY
if(p==null){A.fR(a)
$.bN=$.bM
return}s=new A.cp(a)
r=$.bN
if(r==null){s.b=p
$.aY=$.bN=s}else{q=r.b
s.b=q
$.bN=r.b=s
if(q==null)$.bM=s}},
k_(a,b){A.eS(a,"stream",t.K)
return new A.cu(b.h("cu<0>"))},
jb(a,b){A.jd(new A.e2(a,b))},
jc(a,b){if(B.d!==a)b=a.b4(b,t.H)
A.fR(b)},
dk:function dk(a){this.a=a},
dj:function dj(a,b,c){this.a=a
this.b=b
this.c=c},
dl:function dl(a){this.a=a},
dm:function dm(a){this.a=a},
dB:function dB(){},
dC:function dC(a,b){this.a=a
this.b=b},
co:function co(a,b){this.a=a
this.b=!1
this.$ti=b},
dM:function dM(a){this.a=a},
dN:function dN(a){this.a=a},
eb:function eb(a){this.a=a},
W:function W(a,b){this.a=a
this.b=b},
cq:function cq(){},
bw:function bw(a,b){this.a=a
this.$ti=b},
af:function af(a,b,c,d,e){var _=this
_.a=null
_.b=a
_.c=b
_.d=c
_.e=d
_.$ti=e},
z:function z(a,b){var _=this
_.a=0
_.b=a
_.c=null
_.$ti=b},
dq:function dq(a,b){this.a=a
this.b=b},
du:function du(a,b){this.a=a
this.b=b},
dt:function dt(a,b){this.a=a
this.b=b},
ds:function ds(a,b){this.a=a
this.b=b},
dr:function dr(a,b){this.a=a
this.b=b},
dx:function dx(a,b,c){this.a=a
this.b=b
this.c=c},
dy:function dy(a,b){this.a=a
this.b=b},
dz:function dz(a){this.a=a},
dw:function dw(a,b){this.a=a
this.b=b},
dv:function dv(a,b){this.a=a
this.b=b},
cp:function cp(a){this.a=a
this.b=null},
bs:function bs(){},
d5:function d5(a,b){this.a=a
this.b=b},
d6:function d6(a,b){this.a=a
this.b=b},
cu:function cu(a){this.$ti=a},
dg:function dg(){},
dh:function dh(a,b,c){this.a=a
this.b=b
this.c=c},
di:function di(a,b,c){this.a=a
this.b=b
this.c=c},
e2:function e2(a,b){this.a=a
this.b=b},
ft(a,b){var s=a[b]
return s===a?null:s},
eJ(a,b,c){if(c==null)a[b]=a
else a[b]=c},
eI(){var s=Object.create(null)
A.eJ(s,"<non-identifier-key>",s)
delete s["<non-identifier-key>"]
return s},
x(a,b,c){return b.h("@<0>").m(c).h("fe<1,2>").a(A.jA(a,new A.aB(b.h("@<0>").m(c).h("aB<1,2>"))))},
aC(a,b){return new A.aB(a.h("@<0>").m(b).h("aB<1,2>"))},
fg(a){var s,r
if(A.eZ(a))return"{...}"
s=new A.ci("")
try{r={}
B.a.l($.V,a)
s.a+="{"
r.a=!0
a.V(0,new A.cT(r,s))
s.a+="}"}finally{if(0>=$.V.length)return A.t($.V,-1)
$.V.pop()}r=s.a
return r.charCodeAt(0)==0?r:r},
bz:function bz(){},
aW:function aW(a){var _=this
_.a=0
_.e=_.d=_.c=_.b=null
_.$ti=a},
bA:function bA(a,b){this.a=a
this.$ti=b},
bB:function bB(a,b,c){var _=this
_.a=a
_.b=b
_.c=0
_.d=null
_.$ti=c},
u:function u(){},
ab:function ab(){},
cT:function cT(a,b){this.a=a
this.b=b},
jK(a,b){var s=A.hV(a,b)
if(s!=null)return s
throw A.b(A.l(a,null))},
jy(a){var s=A.hU(a)
if(s!=null)return s
throw A.b(A.l("Invalid double",a))},
hx(a,b){a=A.B(a,new Error())
if(a==null)a=A.bK(a)
a.stack=b.j(0)
throw a},
ff(a,b,c,d){var s,r=c?J.hB(a,d):J.hA(a,d)
if(a!==0&&b!=null)for(s=0;s<r.length;++s)r[s]=b
return r},
U(a,b){var s,r=A.i([],b.h("A<0>"))
for(s=a.gv(a);s.n();)B.a.l(r,s.gp())
return r},
hY(a){return new A.cI(a,A.hF(a,!1,!0,!1,!1,""))},
fn(a,b,c){var s=J.cy(b)
if(!s.n())return a
if(c.length===0){do a+=A.h(s.gp())
while(s.n())}else{a+=A.h(s.gp())
while(s.n())a=a+c+A.h(s.gp())}return a},
i1(){return A.aJ(new Error())},
hv(a){var s=Math.abs(a),r=a<0?"-":""
if(s>=1000)return""+a
if(s>=100)return r+"0"+s
if(s>=10)return r+"00"+s
return r+"000"+s},
fa(a){if(a>=100)return""+a
if(a>=10)return"0"+a
return"00"+a},
bX(a){if(a>=10)return""+a
return"0"+a},
cB(a){if(typeof a=="number"||A.dV(a)||a==null)return J.aN(a)
if(typeof a=="string")return JSON.stringify(a)
return A.hW(a)},
hy(a,b){A.eS(a,"error",t.K)
A.eS(b,"stackTrace",t.l)
A.hx(a,b)},
bS(a){return new A.bR(a)},
I(a,b){return new A.a4(!1,null,b,a)},
f4(a,b,c){return new A.a4(!0,a,b,c)},
bo(a,b,c,d,e){return new A.bn(b,c,!0,a,d,"Invalid value")},
hX(a,b,c){if(0>a||a>c)throw A.b(A.bo(a,0,c,"start",null))
if(b!=null){if(a>b||b>c)throw A.b(A.bo(b,a,c,"end",null))
return b}return c},
fl(a,b){return a},
eB(a,b,c,d){return new A.bY(b,!0,a,d,"Index out of range")},
dd(a){return new A.bv(a)},
fq(a){return new A.cl(a)},
ac(a){return new A.br(a)},
S(a){return new A.bV(a)},
l(a,b){return new A.cE(a,b)},
hz(a,b,c){var s,r
if(A.eZ(a)){if(b==="("&&c===")")return"(...)"
return b+"..."+c}s=A.i([],t.s)
B.a.l($.V,a)
try{A.j5(a,s)}finally{if(0>=$.V.length)return A.t($.V,-1)
$.V.pop()}r=A.fn(b,t.R.a(s),", ")+c
return r.charCodeAt(0)==0?r:r},
fc(a,b,c){var s,r
if(A.eZ(a))return b+"..."+c
s=new A.ci(b)
B.a.l($.V,a)
try{r=s
r.a=A.fn(r.a,a,", ")}finally{if(0>=$.V.length)return A.t($.V,-1)
$.V.pop()}s.a+=c
r=s.a
return r.charCodeAt(0)==0?r:r},
j5(a,b){var s,r,q,p,o,n,m,l=a.gv(a),k=0,j=0
for(;;){if(!(k<80||j<3))break
if(!l.n())return
s=A.h(l.gp())
B.a.l(b,s)
k+=s.length+2;++j}if(!l.n()){if(j<=5)return
if(0>=b.length)return A.t(b,-1)
r=b.pop()
if(0>=b.length)return A.t(b,-1)
q=b.pop()}else{p=l.gp();++j
if(!l.n()){if(j<=4){B.a.l(b,A.h(p))
return}r=A.h(p)
if(0>=b.length)return A.t(b,-1)
q=b.pop()
k+=r.length+2}else{o=l.gp();++j
for(;l.n();p=o,o=n){n=l.gp();++j
if(j>100){for(;;){if(!(k>75&&j>3))break
if(0>=b.length)return A.t(b,-1)
k-=b.pop().length+2;--j}B.a.l(b,"...")
return}}q=A.h(p)
r=A.h(o)
k+=r.length+q.length+4}}if(j>b.length+2){k+=5
m="..."}else m=null
for(;;){if(!(k>80&&b.length>3))break
if(0>=b.length)return A.t(b,-1)
k-=b.pop().length+2
if(m==null){k+=5
m="..."}}if(m!=null)B.a.l(b,m)
B.a.l(b,q)
B.a.l(b,r)},
fi(a,b){var s=J.b1(a)
b=J.b1(b)
b=A.i4(A.fo(A.fo($.hj(),s),b))
return b},
bW:function bW(a,b,c){this.a=a
this.b=b
this.c=c},
w:function w(){},
bR:function bR(a){this.a=a},
ad:function ad(){},
a4:function a4(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
bn:function bn(a,b,c,d,e,f){var _=this
_.e=a
_.f=b
_.a=c
_.b=d
_.c=e
_.d=f},
bY:function bY(a,b,c,d,e){var _=this
_.f=a
_.a=b
_.b=c
_.c=d
_.d=e},
bv:function bv(a){this.a=a},
cl:function cl(a){this.a=a},
br:function br(a){this.a=a},
bV:function bV(a){this.a=a},
bq:function bq(){},
dp:function dp(a){this.a=a},
cE:function cE(a,b){this.a=a
this.b=b},
f:function f(){},
aD:function aD(a,b,c){this.a=a
this.b=b
this.$ti=c},
r:function r(){},
c:function c(){},
cv:function cv(){},
ci:function ci(a){this.a=a},
cU:function cU(a){this.a=a},
cx(a){var s
if(typeof a=="function")throw A.b(A.I("Attempting to rewrap a JS function.",null))
s=function(b,c){return function(d){return b(c,d,arguments.length)}}(A.iG,a)
s[$.bQ()]=a
return s},
eO(a){var s
if(typeof a=="function")throw A.b(A.I("Attempting to rewrap a JS function.",null))
s=function(b,c){return function(d,e){return b(c,d,e,arguments.length)}}(A.iH,a)
s[$.bQ()]=a
return s},
fI(a){var s
if(typeof a=="function")throw A.b(A.I("Attempting to rewrap a JS function.",null))
s=function(b,c){return function(d,e,f){return b(c,d,e,f,arguments.length)}}(A.iI,a)
s[$.bQ()]=a
return s},
iF(a){return t.Z.a(a).$0()},
iG(a,b,c){t.Z.a(a)
if(A.E(c)>=1)return a.$1(b)
return a.$0()},
iH(a,b,c,d){t.Z.a(a)
A.E(d)
if(d>=2)return a.$2(b,c)
if(d===1)return a.$1(b)
return a.$0()},
iI(a,b,c,d,e){t.Z.a(a)
A.E(e)
if(e>=3)return a.$3(b,c,d)
if(e===2)return a.$2(b,c)
if(e===1)return a.$1(b)
return a.$0()},
fO(a){return a==null||A.dV(a)||typeof a=="number"||typeof a=="string"||t.U.b(a)||t.bX.b(a)||t.ca.b(a)||t.G.b(a)||t.c0.b(a)||t.k.b(a)||t.bk.b(a)||t.E.b(a)||t.q.b(a)||t.D.b(a)||t.e.b(a)},
an(a){if(A.fO(a))return a
return new A.en(new A.aW(t.A)).$1(a)},
jB(a,b,c){return c.a(a[b])},
eR(a,b,c,d){return d.a(a[b].apply(a,c))},
fF(a,b,c,d){return d.a(a[b](c))},
f0(a,b){var s=new A.z($.v,b.h("z<0>")),r=new A.bw(s,b.h("bw<0>"))
a.then(A.bO(new A.et(r,b),1),A.bO(new A.eu(r),1))
return s},
fN(a){return a==null||typeof a==="boolean"||typeof a==="number"||typeof a==="string"||a instanceof Int8Array||a instanceof Uint8Array||a instanceof Uint8ClampedArray||a instanceof Int16Array||a instanceof Uint16Array||a instanceof Int32Array||a instanceof Uint32Array||a instanceof Float32Array||a instanceof Float64Array||a instanceof ArrayBuffer||a instanceof DataView},
fV(a){if(A.fN(a))return a
return new A.ed(new A.aW(t.A)).$1(a)},
en:function en(a){this.a=a},
et:function et(a,b){this.a=a
this.b=b},
eu:function eu(a){this.a=a},
ed:function ed(a){this.a=a},
h5(a){var s=A.J(A.e(v.G.document).querySelector(a))
if(s==null)throw A.b(A.ac("No element matches "+a))
return s},
cW:function cW(a,b){this.a=a
this.b=b
this.c=null},
cZ:function cZ(a){this.a=a},
d_:function d_(a){this.a=a},
d0:function d0(a){this.a=a},
d1:function d1(){},
cX:function cX(a){this.a=a},
cY:function cY(a){this.a=a},
d2:function d2(){},
d3:function d3(){},
hn(a){var s,r=A.C(a,"bar"),q=r.i(0,"label")
if(typeof q!="string")A.m(A.l("bar label must be a string",null))
s=A.K(r.i(0,"value"),"bar value")
r=r.i(0,"color")
if(typeof r!="string")A.m(A.l("bar color must be a string",null))
return new A.aq(q,s,r)},
i0(a){var s,r=A.C(a,"slice"),q=r.i(0,"label")
if(typeof q!="string")A.m(A.l("slice label must be a string",null))
s=A.K(r.i(0,"value"),"slice value")
r=r.i(0,"color")
if(typeof r!="string")A.m(A.l("slice color must be a string",null))
if(s<0)A.m(A.l("slice value must be nonnegative",null))
return new A.au(q,s,r)},
hK(a){var s=A.C(a,"point")
return new A.Q(A.K(s.i(0,"x"),"point x"),A.K(s.i(0,"y"),"point y"))},
i_(a){var s,r=A.C(a,"series"),q=r.i(0,"name")
if(typeof q!="string")A.m(A.l("series name must be a string",null))
s=r.i(0,"color")
if(typeof s!="string")A.m(A.l("series color must be a string",null))
r=J.a_(A.a2(r.i(0,"points"),"series points"),A.jt(),t.j)
r=A.U(r,r.$ti.h("q.E"))
if(r.length===0)A.m(A.l("series must have points",null))
return new A.at(q,s,r)},
aq:function aq(a,b,c){this.a=a
this.b=b
this.c=c},
au:function au(a,b,c){this.a=a
this.b=b
this.c=c},
Q:function Q(a,b){this.a=a
this.b=b},
at:function at(a,b,c){this.a=a
this.b=b
this.c=c},
jR(a,b){var s=A.C(b,"pie chart"),r=J.a_(A.a2(s.i(0,"slices"),"slices"),A.jv(),t.J),q=A.U(r,r.$ti.h("q.E")),p=B.a.ad(q,0,new A.ev(),t.i)
if(p<=0)throw A.b(A.l("pie chart requires a positive total",null))
r=s.i(0,"title")
if(typeof r!="string")A.m(A.l("chart title must be a string",null))
A.eg(a,A.j8(r,q,p),null)},
h4(a,b,c){var s=A.C(b,"plot"),r=J.a_(A.a2(s.i(0,"series"),"plot series"),A.ju(),t.p),q=A.U(r,r.$ti.h("q.E"))
if(q.length===0)throw A.b(A.l("plot must have series",null))
r=s.i(0,"title")
if(typeof r!="string")A.m(A.l("plot title must be a string",null))
A.ef(a,A.j9(r,q,c),B.m)},
iE(a,b){var s,r,q,p,o,n,m,l,k,j,i=A.eM(a),h=A.R(b),g=new A.y(b,h.h("d(1)").a(new A.dO()),h.h("y<1,d>")).ad(0,0,B.f,t.i),f=A.eF(0,g===0?1:g,440,100)
for(h=f.aH(),s=h.length,r=t.N,q=t.X,p=0;p<h.length;h.length===s||(0,A.O)(h),++p){o=h[p]
n=f.D(0,o)
B.a.l(i,A.x(["type","line","x1",65,"y1",n,"x2",925,"y2",n,"color","#263b53"],r,q))
m=o===B.b.Z(o)?B.c.j(B.b.I(o)):B.b.N(o,2)
B.a.l(i,A.x(["type","text","x",54,"y",n+4,"text",m,"color","#91a5bd","fontSize",11],r,q))}l=860/b.length
for(h=l*0.14,s=l*0.72,k=0;k<b.length;++k){j=b[k]
n=f.D(0,j.b)
B.a.l(i,A.x(["type","rect","x",65+k*l+h,"y",n,"width",s,"height",440-n,"color",j.c],r,q))
B.a.l(i,A.x(["type","text","x",65+(k+0.5)*l,"y",466,"text",j.a,"color","#91a5bd","fontSize",12],r,q))}return A.eN(a,i)},
j8(a,b,a0){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c=A.eM(a)
for(s=b.length,r=t.N,q=t.X,p=-1.5707963267948966,o=0;o<b.length;b.length===s||(0,A.O)(b),++o,p=l){n=b[o]
m=n.b/a0
l=p+m*3.141592653589793*2
k=Math.cos(p)
j=Math.sin(p)
i=Math.cos(l)
h=Math.sin(l)
g=l-p>3.141592653589793?1:0
B.a.l(c,A.x(["type","path","d","M 270 310 L "+A.h(270+k*145)+" "+A.h(310+j*145)+" A 145 145 0 "+g+" 1 "+A.h(270+i*145)+" "+A.h(310+h*145)+" Z","color",n.c],r,q))
f=(p+l)/2
if(m>0.07)B.a.l(c,A.x(["type","text","x",270+Math.cos(f)*90,"y",310+Math.sin(f)*90,"text",""+B.b.bh(m*100)+"%","color","#07101c","fontSize",15],r,q))}for(e=0;e<b.length;++e){d=180+e*65
B.a.l(c,A.x(["type","rect","x",555,"y",d-12,"width",14,"height",14,"color",b[e].c],r,q))
if(!(e<b.length))return A.t(b,e)
B.a.l(c,A.x(["type","text","x",583,"y",d,"text",b[e].a,"color","#edf5ff","fontSize",14],r,q))
if(!(e<b.length))return A.t(b,e)
s=b[e].b
s=s===B.b.Z(s)?B.c.j(B.b.I(s)):B.b.N(s,2)
B.a.l(c,A.x(["type","text","x",583,"y",d+21,"text",s,"color","#91a5bd","fontSize",12],r,q))}return A.eN(a,c)},
j9(a4,a5,a6){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e,d,c,b,a,a0,a1=A.R(a5),a2=a1.h("b6<1,Q>"),a3=A.U(new A.b6(a5,a1.h("f<Q>(1)").a(new A.dX()),a2),a2.h("f.E"))
a1=A.R(a3)
a2=a1.h("d(1)")
a1=a1.h("y<1,d>")
s=new A.y(a3,a2.a(new A.dY()),a1).Y(0,B.j)
r=new A.y(a3,a2.a(new A.dZ()),a1).Y(0,B.f)
q=new A.y(a3,a2.a(new A.e_()),a1).Y(0,B.j)
p=new A.y(a3,a2.a(new A.e0()),a1).Y(0,B.f)
a1=s===r
a2=a1?s-1:s
o=A.eF(a2,a1?r+1:r,75,920)
a1=q===p
a2=a1?q-1:q
n=A.eF(a2,a1?p+1:p,440,110)
m=A.eM(a4)
for(a1=n.aH(),a2=a1.length,l=t.N,k=t.X,j=0;j<a1.length;a1.length===a2||(0,A.O)(a1),++j){i=a1[j]
h=n.D(0,i)
B.a.l(m,A.x(["type","line","x1",75,"y1",h,"x2",920,"y2",h,"color","#263b53"],l,k))
g=i===B.b.Z(i)?B.c.j(B.b.I(i)):B.b.N(i,2)
B.a.l(m,A.x(["type","text","x",60,"y",h+4,"text",g,"color","#91a5bd","fontSize",11],l,k))}for(a1=o.aI(7),a2=a1.length,j=0;j<a1.length;a1.length===a2||(0,A.O)(a1),++j){i=a1[j]
g=o.D(0,i)
B.a.l(m,A.x(["type","text","x",g,"y",468,"text",i===B.b.Z(i)?B.c.j(B.b.I(i)):B.b.N(i,2),"color","#91a5bd","fontSize",11],l,k))}for(a1=a5.length,a2=!a6,j=0;j<a5.length;a5.length===a1||(0,A.O)(a5),++j){f=a5[j]
if(a2){g=f.c
e=A.R(g)
d=e.h("y<1,a0<j,d>>")
g=A.U(new A.y(g,e.h("a0<j,d>(1)").a(new A.e1(o,n)),d),d.h("q.E"))
B.a.l(m,A.x(["type","polyline","points",g,"color",f.b,"strokeWidth",3],l,k))}for(g=f.c,e=g.length,d=f.b,c=0;c<g.length;g.length===e||(0,A.O)(g),++c){b=g[c]
a=o.D(0,b.a)
a0=n.D(0,b.b)
B.a.l(m,A.x(["type","circle","cx",a,"cy",a0,"r",a6?6:4,"color",d],l,k))}g=B.a.bb(a5,f)*135
B.a.l(m,A.x(["type","circle","cx",45+g,"cy",83,"r",5,"color",d],l,k))
B.a.l(m,A.x(["type","text","x",58+g,"y",88,"text",f.a,"color","#91a5bd","fontSize",12],l,k))}return A.eN(a4,m)},
eM(a){var s=t.N,r=t.X
return A.i([A.x(["type","rect","x",0,"y",0,"width",960,"height",540,"color","#0b1726"],s,r),A.x(["type","text","x",32,"y",48,"text",a,"color","#edf5ff","fontSize",24],s,r)],t.bM)},
eN(a,b){return A.x(["title",a,"width",960,"height",540,"commands",b],t.N,t.X)},
ev:function ev(){},
dO:function dO(){},
dX:function dX(){},
dY:function dY(){},
dZ:function dZ(){},
e_:function e_(){},
e0:function e0(){},
e1:function e1(a,b){this.a=a
this.b=b},
fb(a){var s="draw command",r=A.C(a,s),q=A.C(a,s).i(0,"type")
if(typeof q!="string")A.m(A.l("draw type must be a string",null))
return new A.ar(q,r)},
hw(a){return A.fb(a)},
fX(a){var s=J.a_(A.a2(A.C(a,"drawing").i(0,"commands"),"drawing commands"),A.jz(),t.I)
s=A.U(s,s.$ti.h("q.E"))
return s},
eg(a,b,c){var s,r,q,p,o,n,m
a.textContent=""
s=A.C(b,"drawing")
r=A.K(s.i(0,"width"),"drawing width")
q=A.K(s.i(0,"height"),"drawing height")
p=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","svg"))
p.setAttribute("viewBox","0 0 "+A.h(r)+" "+A.h(q))
p.setAttribute("role","img")
o=s.i(0,"title")
if(typeof o!="string")A.m(A.l("drawing title must be a string",null))
p.setAttribute("aria-label",o)
A.e(a.appendChild(p))
for(o=A.fX(b),n=o.length,m=0;m<o.length;o.length===n||(0,A.O)(o),++m)A.e(p.appendChild(A.jk(o[m],c)))},
jk(a,b){var s,r,q="strokeWidth",p=b==null?a.a_("color","#61d6c5"):b,o=a.a
switch(o){case"rect":s=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","rect"))
A.dL(s,a,A.i(["x","y","width","height","rx"],t.s))
s.setAttribute("fill",p)
break
case"circle":s=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","circle"))
A.dL(s,a,A.i(["cx","cy","r"],t.s))
s.setAttribute("fill",p)
break
case"line":s=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","line"))
A.dL(s,a,A.i(["x1","y1","x2","y2"],t.s))
s.setAttribute("stroke",p)
s.setAttribute("stroke-width",A.h(a.F(q,2)))
break
case"polyline":s=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","polyline"))
o=a.aC()
r=A.R(o)
s.setAttribute("points",new A.y(o,r.h("j(1)").a(new A.e4()),r.h("y<1,j>")).af(0," "))
s.setAttribute("fill","none")
s.setAttribute("stroke",p)
s.setAttribute("stroke-width",A.h(a.F(q,2)))
break
case"path":s=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","path"))
s.setAttribute("d",a.P("d"))
s.setAttribute("fill",p)
break
case"text":s=A.e(A.e(v.G.document).createElementNS("http://www.w3.org/2000/svg","text"))
A.dL(s,a,A.i(["x","y"],t.s))
s.setAttribute("fill",p)
s.setAttribute("font-size",A.h(a.F("fontSize",16)))
s.textContent=a.P("text")
break
default:throw A.b(A.l("Unknown SVG command: "+o,null))}if(a.b.H("opacity"))s.setAttribute("opacity",A.h(a.q("opacity")))
return s},
ef(a,b,c){var s,r,q,p,o,n,m,l=A.J(a.getContext("2d"))
if(l==null)throw A.b(A.ac("Canvas 2D is unavailable"))
s=A.C(b,"drawing")
r=A.K(s.i(0,"width"),"drawing width")
q=A.K(s.i(0,"height"),"drawing height")
a.width=B.b.I(r)
a.height=B.b.I(q)
p=A.fX(b)
for(o=p.length,n=0;n<p.length;p.length===o||(0,A.O)(p),++n)A.iJ(l,p[n])
for(o=c.length,n=0;n<c.length;c.length===o||(0,A.O)(c),++n){m=c[n]
l.beginPath()
l.arc.apply(l,[A.a6(m.x),A.a6(m.y),12,0,6.283185307179586])
l.fillStyle="#ff7f9f"
l.fill()
l.strokeStyle="#ffffff"
l.lineWidth=2
l.stroke()}},
iJ(a,b){var s,r,q,p,o,n,m,l=null,k="strokeWidth",j=b.a_("color","#61d6c5"),i=b.a
switch(i){case"rect":a.fillStyle=j
a.fillRect(b.q("x"),b.q("y"),b.q("width"),b.q("height"))
break
case"circle":a.beginPath()
A.eR(a,"arc",[b.q("cx"),b.q("cy"),b.q("r"),0,6.283185307179586],t.H)
a.fillStyle=j
a.fill()
break
case"line":a.beginPath()
a.moveTo(b.q("x1"),b.q("y1"))
a.lineTo(b.q("x2"),b.q("y2"))
a.strokeStyle=j
a.lineWidth=b.F(k,2)
a.stroke()
break
case"polyline":s=b.aC()
if(s.length===0)return
a.beginPath()
a.moveTo(B.a.gaF(s).q("x"),B.a.gaF(s).q("y"))
for(i=A.i3(s,1,l,A.R(s).c),r=i.$ti,i=new A.aa(i,i.gk(0),r.h("aa<q.E>")),r=r.h("q.E");i.n();){q=i.d
if(q==null)q=r.a(q)
p=q.b
o=p.i(0,"x")
if(o==null)n=0
else{n=q.a
if(typeof o!="number"||!isFinite(o))A.m(A.l(n+".x must be a finite number",l))
n=o}o=p.i(0,"y")
if(o==null)q=0
else{q=q.a
if(typeof o!="number"||!isFinite(o))A.m(A.l(q+".y must be a finite number",l))
q=o}a.lineTo(n,q)}a.strokeStyle=j
a.lineWidth=b.F(k,2)
a.stroke()
break
case"path":m=A.e(new v.G.Path2D(b.P("d")))
a.fillStyle=j
a.fill(m)
break
case"text":a.fillStyle=j
a.font=A.h(b.F("fontSize",16))+"px system-ui, sans-serif"
a.fillText(b.P("text"),b.q("x"),b.q("y"))
break
default:throw A.b(A.l("Unknown Canvas command: "+i,l))}},
dL(a,b,c){var s,r,q,p,o,n,m
for(s=c.length,r=b.a+".",q=b.b,p=0;p<c.length;c.length===s||(0,A.O)(c),++p){o=c[p]
n=q.i(0,o)
if(n==null)m=0
else{if(typeof n!="number"||!isFinite(n))A.m(A.l(r+o+" must be a finite number",null))
m=n}a.setAttribute(o,A.h(m))}},
ar:function ar(a,b){this.a=a
this.b=b},
cA:function cA(a){this.a=a},
e4:function e4(){},
C(a,b){if(!(a instanceof A.ab))throw A.b(A.l(b+" must be a JSON object",null))
return a.be(0,new A.eo(b),t.N,t.X)},
a2(a,b){if(!t.c.b(a))throw A.b(A.l(b+" must be a JSON array",null))
return a},
K(a,b){if(typeof a!="number"||!isFinite(a))throw A.b(A.l(b+" must be a finite number",null))
return a},
eo:function eo(a){this.a=a},
fh(){var s=new Float32Array(16)
s[15]=1
s[10]=1
s[5]=1
s[0]=1
return new A.aR(s)},
aR:function aR(a){this.a=a},
eF(a,b,c,d){var s=new A.cQ(a,b,c,d)
s.aL(a,b,c,d)
return s},
hI(a){var s,r,q,p
for(s=Math.abs(a),r=a<0,q=1,p=0;p<s;++p)q*=r?0.1:10
return q},
ib(a){var s,r
for(s=a,r=0;s>=10;){s/=10;++r}while(s<1){s*=10;--r}return r},
cQ:function cQ(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
cR:function cR(){},
hG(a){var s,r=J.a_(A.a2(a.i(0,"columns"),"table columns"),new A.cO(),t.N)
r=A.U(r,r.$ti.h("q.E"))
s=J.a_(A.a2(a.i(0,"rows"),"table rows"),new A.cP(),t.W)
s=A.U(s,s.$ti.h("q.E"))
r=new A.cL(r,s)
r.aK(a)
return r},
cL:function cL(a,b){this.a=a
this.b=b},
cO:function cO(){},
cP:function cP(){},
cM:function cM(a,b){this.a=a
this.b=b},
cN:function cN(a,b){this.a=a
this.b=b},
hm(a){var s,r=A.C(a,"attribute tween"),q=r.i(0,"selector")
if(typeof q!="string")A.m(A.l("tween selector must be a string",null))
s=r.i(0,"attribute")
if(typeof s!="string")A.m(A.l("tween attribute must be a string",null))
return new A.aO(q,s,A.K(r.i(0,"from"),"tween from"),A.K(r.i(0,"to"),"tween to"))},
hL(a){var s=A.C(a,"position tween"),r=s.i(0,"selector")
if(typeof r!="string")A.m(A.l("position selector must be a string",null))
return new A.aU(r,A.K(s.i(0,"fromX"),"position fromX"),A.K(s.i(0,"fromY"),"position fromY"),A.K(s.i(0,"toX"),"position toX"),A.K(s.i(0,"toY"),"position toY"))},
aO:function aO(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d},
aU:function aU(a,b,c,d,e){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=e},
ck:function ck(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.d=d
_.e=!1
_.f=0
_.r=null},
fr(a,b,c){var s=A.J(a.createShader(b))
s.toString
a.shaderSource(s,c)
a.compileShader(s)
if(!A.cw(a.getShaderParameter(s,35713)))throw A.b(A.ac("WebGL shader failed: "+A.h(A.fF(a,"getShaderInfoLog",s,t.w))))
return s},
i6(a){var s,r,q,p,o,n,m=t.u,l=t.a2,k=[A.i([A.i([-1,-1,1],m),A.i([1,-1,1],m),A.i([1,1,1],m),A.i([-1,1,1],m)],l),A.i([A.i([1,-1,-1],m),A.i([-1,-1,-1],m),A.i([-1,1,-1],m),A.i([1,1,-1],m)],l),A.i([A.i([-1,-1,-1],m),A.i([-1,-1,1],m),A.i([-1,1,1],m),A.i([-1,1,-1],m)],l),A.i([A.i([1,-1,1],m),A.i([1,-1,-1],m),A.i([1,1,-1],m),A.i([1,1,1],m)],l),A.i([A.i([-1,1,1],m),A.i([1,1,1],m),A.i([1,1,-1],m),A.i([-1,1,-1],m)],l),A.i([A.i([-1,-1,-1],m),A.i([1,-1,-1],m),A.i([1,-1,1],m),A.i([-1,-1,1],m)],l)],j=A.i([],m)
for(m=k.length,s=0;s<6;++s){if(!(s<a.length))return A.t(a,s)
r=A.i5(a[s])
for(l=[0,1,2,0,2,3],q=l.length,p=0;p<q;++p){o=l[p]
if(!(s<m))return A.t(k,s)
n=k[s]
if(!(o<4))return A.t(n,o)
B.a.L(j,n[o])
B.a.L(j,r)}}return new Float32Array(A.iL(j))},
i5(a){var s=A.hY("^#[0-9a-fA-F]{6}$")
if(!s.b.test(a))throw A.b(A.l("Color must be #rrggbb",null))
s=t.V
s=A.U(new A.y(A.i([1,3,5],t.c4),t.bs.a(new A.de(a)),s),s.h("q.E"))
return s},
cn:function cn(a){var _=this
_.c=_.b=_.a=$
_.d=a
_.e=0
_.f=null
_.r=!1},
df:function df(){},
de:function de(a){this.a=a},
a5(a,b,c,d,e){var s=A.jn(new A.dn(c),t.m)
s=s==null?null:A.cx(s)
if(s!=null)a.addEventListener(b,s,!1)
return new A.by(a,b,s,!1,e.h("by<0>"))},
jn(a,b){var s=$.v
if(s===B.d)return a
return s.b5(a,b)},
eA:function eA(a,b){this.a=a
this.$ti=b},
bx:function bx(){},
cr:function cr(a,b,c,d){var _=this
_.a=a
_.b=b
_.c=c
_.$ti=d},
by:function by(a,b,c,d,e){var _=this
_.b=a
_.c=b
_.d=c
_.e=d
_.$ti=e},
dn:function dn(a){this.a=a},
jM(){var s="dart.stamp",r=$.ap(),q=t.d.a(new A.ep()),p=r.a.H(s)
if(p)A.m(A.I("Duplicate or empty runtime handler: dart.stamp",null))
r.b.A(0,s,q)
r.bc()
r.sbg(new A.eq())},
a7(){var s=0,r=A.ak(t.H),q=1,p=[],o,n,m,l,k,j,i
var $async$a7=A.al(function(a,b){if(a===1){p.push(b)
s=q}for(;;)switch(s){case 0:m=v.G
l=A.J(A.e(m.document).body)
k=l==null?null:A.bL(l.getAttribute("data-page"))
j=k==null?"cover":k
q=3
case 6:switch(j){case"cover":s=8
break
case"hydration":s=9
break
case"table":s=10
break
case"svg":s=11
break
case"canvas":s=12
break
case"chart":s=13
break
case"plot":s=14
break
case"animation":s=15
break
case"webgl":s=16
break
default:s=17
break}break
case 8:s=7
break
case 9:s=18
return A.H(A.dT(),$async$a7)
case 18:s=7
break
case 10:s=19
return A.H(A.e6(),$async$a7)
case 19:s=7
break
case 11:s=20
return A.H(A.e3(),$async$a7)
case 20:s=7
break
case 12:s=21
return A.H(A.dP(),$async$a7)
case 21:s=7
break
case 13:s=22
return A.H(A.dS(),$async$a7)
case 22:s=7
break
case 14:s=23
return A.H(A.dW(),$async$a7)
case 23:s=7
break
case 15:s=24
return A.H(A.dH(),$async$a7)
case 24:s=7
break
case 16:s=25
return A.H(A.e8(),$async$a7)
case 25:s=7
break
case 17:l=A.ac("Unknown page "+A.h(j))
throw A.b(l)
case 7:q=1
s=5
break
case 3:q=2
i=p.pop()
o=A.aM(i)
m=A.J(A.e(m.document).getElementById("status"))
if(m!=null)m.textContent="Unable to start "+A.h(j)+": "+A.h(o)
throw i
s=5
break
case 2:s=1
break
case 5:return A.ah(null,r)
case 1:return A.ag(p.at(-1),r)}})
return A.ai($async$a7,r)},
dT(){var s=0,r=A.ak(t.H),q,p,o
var $async$dT=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:o=A
s=2
return A.H(A.Z("data/hydration.json"),$async$dT)
case 2:p=o.C(b,"hydration")
A.jE(A.F("hydration-card"),p)
q=t.a
A.a5(A.F("action"),"click",q.h("~(1)?").a(new A.dU()),!1,q.c)
A.a8("Hydrated static HTML from JSON. Click the button to run JavaScript and Dart handlers.")
return A.ah(null,r)}})
return A.ai($async$dT,r)},
e6(){var s=0,r=A.ak(t.H),q,p,o
var $async$e6=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:p=A
o=A
s=2
return A.H(A.Z("data/table.json"),$async$e6)
case 2:q=p.hG(o.C(b,"table"))
q.b3(A.F("data-table"),new A.e7(q))
A.a8("Bound "+q.b.length+" JSON rows to the HTML table. Select a row with click or Enter.")
return A.ah(null,r)}})
return A.ai($async$e6,r)},
e3(){var s=0,r=A.ak(t.H),q,p
var $async$e3=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:s=2
return A.H(A.Z("data/svg.json"),$async$e3)
case 2:p=b
A.eg(A.F("scene"),p,null)
q=t.a
A.a5(A.F("action"),"click",q.h("~(1)?").a(new A.e5(p)),!1,q.c)
A.a8("SVG created from data/svg.json. Change the palette through the registered JavaScript handler.")
return A.ah(null,r)}})
return A.ai($async$e3,r)},
dP(){var s=0,r=A.ak(t.H),q,p,o,n,m
var $async$dP=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:s=2
return A.H(A.Z("data/canvas.json"),$async$dP)
case 2:o=b
n=A.F("scene-canvas")
m=A.i([],t.O)
A.ef(n,o,m)
q=t.a
p=q.h("~(1)?")
q=q.c
A.a5(n,"click",p.a(new A.dQ(n,m,o)),!1,q)
A.a5(A.F("action"),"click",p.a(new A.dR(m,n,o)),!1,q)
A.a8("Canvas drawn from data/canvas.json. Click the drawing to add a pointer mark.")
return A.ah(null,r)}})
return A.ai($async$dP,r)},
dS(){var s=0,r=A.ak(t.H),q,p,o,n,m,l
var $async$dS=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:l=A
s=2
return A.H(A.Z("data/chart.json"),$async$dS)
case 2:q=l.C(b,"charts")
p=A.F("bar-chart")
o=A.C(q.i(0,"bar"),"bar chart")
n=J.a_(A.a2(o.i(0,"bars"),"bars"),A.js(),t.x)
m=A.U(n,n.$ti.h("q.E"))
if(m.length===0)A.m(A.l("bar chart must have bars",null))
n=o.i(0,"title")
if(typeof n!="string")A.m(A.l("chart title must be a string",null))
A.eg(p,A.iE(n,m),null)
A.jR(A.F("pie-chart"),q.i(0,"pie"))
A.a8("Rendered bar and pie charts from data/chart.json as retained SVG.")
return A.ah(null,r)}})
return A.ai($async$dS,r)},
dW(){var s=0,r=A.ak(t.H),q,p
var $async$dW=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:p=A
s=2
return A.H(A.Z("data/plot.json"),$async$dW)
case 2:q=p.C(b,"plots")
A.h4(A.F("line-plot"),q.i(0,"line"),!1)
A.h4(A.F("scatter-plot"),q.i(0,"scatter"),!0)
A.a8("Rendered line and scatter plots from data/plot.json through Canvas 2D.")
return A.ah(null,r)}})
return A.ai($async$dW,r)},
dH(){var s=0,r=A.ak(t.H),q,p,o,n,m,l
var $async$dH=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:s=2
return A.H(A.Z("data/tween.json"),$async$dH)
case 2:p=b
o=A.F("particle-canvas")
n=A.C(p,"animation")
m=A.K(n.i(0,"duration"),"animation duration")
l=J.a_(A.a2(n.i(0,"attributes"),"animation attributes"),A.jU(),t.h)
l=A.U(l,l.$ti.h("q.E"))
n=J.a_(A.a2(n.i(0,"positions"),"animation positions"),A.jV(),t.bH)
n=A.U(n,n.$ti.h("q.E"))
q=new A.ck(m,l,n,new A.dI(o))
if(m<=0)A.m(A.l("animation duration must be positive",null))
q.G()
A.E(A.e(v.G.window).requestAnimationFrame(A.cx(q.gaB())))
n=t.a
m=n.h("~(1)?")
n=n.c
A.a5(A.F("action"),"click",m.a(new A.dJ(q)),!1,n)
A.a5(A.F("reset"),"click",m.a(new A.dK(q)),!1,n)
A.a8("Animation running: SVG position/radius/opacity tweens and Canvas particles share one Dart clock.")
return A.ah(null,r)}})
return A.ai($async$dH,r)},
e8(){var s=0,r=A.ak(t.H),q,p,o,n,m,l,k
var $async$e8=A.al(function(a,b){if(a===1)return A.ag(b,r)
for(;;)switch(s){case 0:s=2
return A.H(A.Z("data/webgl.json"),$async$e8)
case 2:n=b
m=A.F("scene-canvas")
l=new A.cn(A.K(A.C(n,"WebGL scene").i(0,"speed"),"WebGL speed"))
k=A.J(m.getContext("webgl",{preserveDrawingBuffer:!0}))
if(k==null)A.m(A.ac("WebGL is unavailable"))
l.a=k
q=A.fr(k,35633,"attribute vec3 position;\nattribute vec3 color;\nuniform mat4 matrix;\nvarying vec3 vColor;\nvoid main() {\n  gl_Position = matrix * vec4(position, 1.0);\n  vColor = color * (0.82 + 0.18 * abs(normalize(position).z));\n}\n")
p=A.fr(k,35632,"precision mediump float;\nvarying vec3 vColor;\nvoid main() { gl_FragColor = vec4(vColor, 1.0); }\n")
o=A.J(k.createProgram())
o.toString
k.attachShader(o,q)
k.attachShader(o,p)
k.linkProgram(o)
if(!A.cw(k.getProgramParameter(o,35714)))A.m(A.ac("WebGL link failed: "+A.h(A.fF(k,"getProgramInfoLog",o,t.w))))
l.b=o
o=A.J(k.getUniformLocation(o,"matrix"))
o.toString
l.c=o
l.aW(m,A.C(n,"WebGL scene"))
A.E(A.e(v.G.window).requestAnimationFrame(A.cx(l.gar())))
m=t.a
o=m.h("~(1)?")
m=m.c
A.a5(A.F("action"),"click",o.a(new A.e9(l)),!1,m)
A.a5(A.F("reset"),"click",o.a(new A.ea(l)),!1,m)
A.a8("WebGL cube running: Dart shaders, matrices, buffers, and animation; no 3D JavaScript library.")
return A.ah(null,r)}})
return A.ai($async$e8,r)},
j7(a,b){var s,r,q,p,o,n,m=A.J(a.getContext("2d"))
if(m==null)m=A.e(m)
m.fillStyle="#0b1726"
m.fillRect(0,0,320,540)
for(s=0;s<16;++s){r=B.c.ai(s,4)
q=b*(0.7+r*0.1)+s*0.7
p=Math.cos(q)
o=Math.sin(q*1.17)
m.beginPath()
m.arc.apply(m,[160+p*(35+s*5),270+o*(25+s*4),4+r,0,6.283185307179586])
n=B.c.ai(s,2)===0?"#61d6c5":"#ffcb6b"
m.fillStyle=n
m.fill()}},
F(a){var s=A.J(A.e(v.G.document).getElementById(a))
return s==null?A.m(A.ac("Missing #"+a)):s},
a8(a){var s="Ready: "+a
A.F("status").textContent=s
return s},
ep:function ep(){},
eq:function eq(){},
dU:function dU(){},
e7:function e7(a){this.a=a},
e5:function e5(a){this.a=a},
dQ:function dQ(a,b,c){this.a=a
this.b=b
this.c=c},
dR:function dR(a,b,c){this.a=a
this.b=b
this.c=c},
dI:function dI(a){this.a=a},
dJ:function dJ(a){this.a=a},
dK:function dK(a){this.a=a},
e9:function e9(a){this.a=a},
ea:function ea(a){this.a=a},
h6(a){return v.mangledGlobalNames[a]},
jS(a){throw A.B(new A.be("Field '"+a+"' has been assigned during initialization."),new Error())},
ew(){throw A.B(A.hH(""),new Error())},
h1(a,b,c){A.fU(c,t.n,"T","min")
return Math.min(c.a(a),c.a(b))},
h0(a,b,c){A.fU(c,t.n,"T","max")
return Math.max(c.a(a),c.a(b))},
jE(a,b){var s,r,q,p,o,n=A.e(a.querySelectorAll("[data-hydrate]"))
for(s=0;s<A.E(n.length);++s){r=A.J(n.item(s))
q=A.bL(r.getAttribute("data-hydrate"))
q.toString
p=b.i(0,q)
if(typeof p!="string")A.m(A.l("hydration field "+q+" must be a string",null))
o=A.bL(r.getAttribute("data-hydrate-attribute"))
if(o==null)r.textContent=p
else r.setAttribute(o,p)}a.setAttribute("data-hydrated","true")},
Z(a){var s=0,r=A.ak(t.X),q,p,o
var $async$Z=A.al(function(b,c){if(b===1)return A.ag(c,r)
for(;;)switch(s){case 0:s=3
return A.H(A.f0(A.e(A.e(v.G.window).fetch(a)),t.m),$async$Z)
case 3:p=c
if(!A.cw(p.ok))throw A.b(A.ac("JSON request failed: HTTP "+A.h(A.jB(p,"status",t.S))+" for "+a))
o=A
s=4
return A.H(A.f0(A.e(p.json()),t.X),$async$Z)
case 4:q=o.fV(c)
s=1
break
case 1:return A.ah(q,r)}})
return A.ai($async$Z,r)},
eU(a){var s
if(a<=0)return 0
if(a>=1)return 1
if(a<0.5)s=4*a*a*a
else{s=1-a
s=1-4*s*s*s}return s}},B={}
var w=[A,J,B]
var $={}
A.eD.prototype={}
J.c_.prototype={
E(a,b){return a===b},
gu(a){return A.ce(a)},
j(a){return"Instance of '"+A.cf(a)+"'"},
gt(a){return A.am(A.eP(this))}}
J.c1.prototype={
j(a){return String(a)},
gu(a){return a?519018:218159},
gt(a){return A.am(t.y)},
$io:1,
$iaH:1}
J.b9.prototype={
E(a,b){return null==b},
j(a){return"null"},
gu(a){return 0},
$io:1,
$ir:1}
J.bc.prototype={$ip:1}
J.as.prototype={
gu(a){return 0},
j(a){return String(a)}}
J.cd.prototype={}
J.bu.prototype={}
J.P.prototype={
j(a){var s=a[$.h8()]
if(s==null)s=a[$.bQ()]
if(s==null)return this.aJ(a)
return"JavaScript function for "+J.aN(s)},
$ia9:1}
J.bb.prototype={
gu(a){return 0},
j(a){return String(a)}}
J.bd.prototype={
gu(a){return 0},
j(a){return String(a)}}
J.A.prototype={
l(a,b){A.R(a).c.a(b)
a.$flags&1&&A.bP(a,29)
a.push(b)},
L(a,b){var s
A.R(a).h("f<1>").a(b)
a.$flags&1&&A.bP(a,"addAll",2)
if(Array.isArray(b)){this.aO(a,b)
return}for(s=J.cy(b);s.n();)a.push(s.gp())},
aO(a,b){var s,r
t.b.a(b)
s=b.length
if(s===0)return
if(a===b)throw A.b(A.S(a))
for(r=0;r<s;++r)a.push(b[r])},
b7(a){a.$flags&1&&A.bP(a,"clear","clear")
a.length=0},
X(a,b,c){var s=A.R(a)
return new A.y(a,s.m(c).h("1(2)").a(b),s.h("@<1>").m(c).h("y<1,2>"))},
af(a,b){var s,r=A.ff(a.length,"",!1,t.N)
for(s=0;s<a.length;++s)this.A(r,s,A.h(a[s]))
return r.join(b)},
ad(a,b,c,d){var s,r,q
d.a(b)
A.R(a).m(d).h("1(1,2)").a(c)
s=a.length
for(r=b,q=0;q<s;++q){r=c.$2(r,a[q])
if(a.length!==s)throw A.b(A.S(a))}return r},
B(a,b){if(!(b<a.length))return A.t(a,b)
return a[b]},
gaF(a){if(a.length>0)return a[0]
throw A.b(A.eC())},
b8(a,b){var s,r
A.R(a).h("aH(1)").a(b)
s=a.length
for(r=0;r<s;++r){if(!b.$1(a[r]))return!1
if(a.length!==s)throw A.b(A.S(a))}return!0},
bb(a,b){var s,r=a.length
if(0>=r)return-1
for(s=0;s<r;++s){if(!(s<a.length))return A.t(a,s)
if(J.f2(a[s],b))return s}return-1},
j(a){return A.fc(a,"[","]")},
gv(a){return new J.b2(a,a.length,A.R(a).h("b2<1>"))},
gu(a){return A.ce(a)},
gk(a){return a.length},
A(a,b,c){var s
A.R(a).c.a(c)
a.$flags&2&&A.bP(a)
s=a.length
if(b>=s)throw A.b(A.fW(a,b))
a[b]=c},
$ik:1,
$if:1,
$in:1}
J.c0.prototype={
bl(a){var s,r,q
if(!Array.isArray(a))return null
s=a.$flags|0
if((s&4)!==0)r="const, "
else if((s&2)!==0)r="unmodifiable, "
else r=(s&1)!==0?"fixed, ":""
q="Instance of '"+A.cf(a)+"'"
if(r==="")return q
return q+" ("+r+"length: "+a.length+")"}}
J.cJ.prototype={}
J.b2.prototype={
gp(){var s=this.d
return s==null?this.$ti.c.a(s):s},
n(){var s,r=this,q=r.a,p=q.length
if(r.b!==p){q=A.O(q)
throw A.b(q)}s=r.c
if(s>=p){r.d=null
return!1}r.d=q[s]
r.c=s+1
return!0},
$iX:1}
J.ba.prototype={
aa(a,b){var s
if(a<b)return-1
else if(a>b)return 1
else if(a===b){if(a===0){s=B.c.gW(b)
if(this.gW(a)===s)return 0
if(this.gW(a))return-1
return 1}return 0}else if(isNaN(a)){if(isNaN(b))return 0
return 1}else return-1},
gW(a){return a===0?1/a<0:a<0},
I(a){var s
if(a>=-2147483648&&a<=2147483647)return a|0
if(isFinite(a)){s=a<0?Math.ceil(a):Math.floor(a)
return s+0}throw A.b(A.dd(""+a+".toInt()"))},
b6(a){var s,r
if(a>=0){if(a<=2147483647){s=a|0
return a===s?s:s+1}}else if(a>=-2147483648)return a|0
r=Math.ceil(a)
if(isFinite(r))return r
throw A.b(A.dd(""+a+".ceil()"))},
bh(a){if(a>0){if(a!==1/0)return Math.round(a)}else if(a>-1/0)return 0-Math.round(0-a)
throw A.b(A.dd(""+a+".round()"))},
Z(a){if(a<0)return-Math.round(-a)
else return Math.round(a)},
aD(a,b,c){if(B.c.aa(b,c)>0)throw A.b(A.jo(b))
if(this.aa(a,b)<0)return b
if(this.aa(a,c)>0)return c
return a},
N(a,b){var s
if(b>20)throw A.b(A.bo(b,0,20,"fractionDigits",null))
s=a.toFixed(b)
if(a===0&&this.gW(a))return"-"+s
return s},
j(a){if(a===0&&1/a<0)return"-0.0"
else return""+a},
gu(a){var s,r,q,p,o=a|0
if(a===o)return o&536870911
s=Math.abs(a)
r=Math.log(s)/0.6931471805599453|0
q=Math.pow(2,r)
p=s<1?s/q:q/s
return((p*9007199254740992|0)+(p*3542243181176521|0))*599197+r*1259&536870911},
ai(a,b){var s=a%b
if(s===0)return 0
if(s>0)return s
return s+b},
b0(a,b){var s
if(a>0)s=this.b_(a,b)
else{s=b>31?31:b
s=a>>s>>>0}return s},
b_(a,b){return b>31?0:a>>>b},
gt(a){return A.am(t.n)},
$id:1,
$iao:1}
J.b8.prototype={
gt(a){return A.am(t.S)},
$io:1,
$ia:1}
J.c2.prototype={
gt(a){return A.am(t.i)},
$io:1}
J.aQ.prototype={
ak(a,b,c){return a.substring(b,A.hX(b,c,a.length))},
bk(a){var s,r,q,p=a.trim(),o=p.length
if(o===0)return p
if(0>=o)return A.t(p,0)
if(p.charCodeAt(0)===133){s=J.hD(p,1)
if(s===o)return""}else s=0
r=o-1
if(!(r>=0))return A.t(p,r)
q=p.charCodeAt(r)===133?J.hE(p,r):o
if(s===0&&q===o)return p
return p.substring(s,q)},
j(a){return a},
gu(a){var s,r,q
for(s=a.length,r=0,q=0;q<s;++q){r=r+a.charCodeAt(q)&536870911
r=r+((r&524287)<<10)&536870911
r^=r>>6}r=r+((r&67108863)<<3)&536870911
r^=r>>11
return r+((r&16383)<<15)&536870911},
gt(a){return A.am(t.N)},
gk(a){return a.length},
$io:1,
$ij:1}
A.be.prototype={
j(a){return"LateInitializationError: "+this.a}}
A.d4.prototype={}
A.k.prototype={}
A.q.prototype={
gv(a){var s=this
return new A.aa(s,s.gk(s),A.aj(s).h("aa<q.E>"))},
af(a,b){var s,r,q,p=this,o=p.gk(p)
if(b.length!==0){if(o===0)return""
s=A.h(p.B(0,0))
if(o!==p.gk(p))throw A.b(A.S(p))
for(r=s,q=1;q<o;++q){r=r+b+A.h(p.B(0,q))
if(o!==p.gk(p))throw A.b(A.S(p))}return r.charCodeAt(0)==0?r:r}else{for(q=0,r="";q<o;++q){r+=A.h(p.B(0,q))
if(o!==p.gk(p))throw A.b(A.S(p))}return r.charCodeAt(0)==0?r:r}},
X(a,b,c){var s=A.aj(this)
return new A.y(this,s.m(c).h("1(q.E)").a(b),s.h("@<q.E>").m(c).h("y<1,2>"))},
Y(a,b){var s,r,q,p=this
A.aj(p).h("q.E(q.E,q.E)").a(b)
s=p.gk(p)
if(s===0)throw A.b(A.eC())
r=p.B(0,0)
for(q=1;q<s;++q){r=b.$2(r,p.B(0,q))
if(s!==p.gk(p))throw A.b(A.S(p))}return r},
ad(a,b,c,d){var s,r,q,p=this
d.a(b)
A.aj(p).m(d).h("1(1,q.E)").a(c)
s=p.gk(p)
for(r=b,q=0;q<s;++q){r=c.$2(r,p.B(0,q))
if(s!==p.gk(p))throw A.b(A.S(p))}return r}}
A.bt.prototype={
gaS(){var s=this.a.length
return s},
gb1(){var s=this.a.length,r=this.b
if(r>s)return s
return r},
gk(a){var s=this.a.length,r=this.b
if(r>=s)return 0
return s-r},
B(a,b){var s=this,r=s.gb1()+b,q=s.gaS()
if(r>=q)throw A.b(A.eB(b,s.gk(0),s,"index"))
return J.f3(s.a,r)}}
A.aa.prototype={
gp(){var s=this.d
return s==null?this.$ti.c.a(s):s},
n(){var s,r=this,q=r.a,p=J.fY(q),o=p.gk(q)
if(r.b!==o)throw A.b(A.S(q))
s=r.c
if(s>=o){r.d=null
return!1}r.d=p.B(q,s);++r.c
return!0},
$iX:1}
A.aE.prototype={
gv(a){var s=this.a
return new A.bh(s.gv(s),this.b,A.aj(this).h("bh<1,2>"))},
gk(a){var s=this.a
return s.gk(s)}}
A.b3.prototype={$ik:1}
A.bh.prototype={
n(){var s=this,r=s.b
if(r.n()){s.a=s.c.$1(r.gp())
return!0}s.a=null
return!1},
gp(){var s=this.a
return s==null?this.$ti.y[1].a(s):s},
$iX:1}
A.y.prototype={
gk(a){return J.ex(this.a)},
B(a,b){return this.b.$1(J.f3(this.a,b))}}
A.b6.prototype={
gv(a){return new A.b7(J.cy(this.a),this.b,B.o,this.$ti.h("b7<1,2>"))}}
A.b7.prototype={
gp(){var s=this.d
return s==null?this.$ti.y[1].a(s):s},
n(){var s,r,q=this,p=q.c
if(p==null)return!1
for(s=q.a,r=q.b;!p.n();){q.d=null
if(s.n()){q.c=null
p=J.cy(r.$1(s.gp()))
q.c=p}else return!1}q.d=q.c.gp()
return!0},
$iX:1}
A.b4.prototype={
n(){return!1},
gp(){throw A.b(A.eC())},
$iX:1}
A.M.prototype={}
A.bZ.prototype={
E(a,b){if(b==null)return!1
return b instanceof A.aA&&this.a.E(0,b.a)&&A.eX(this)===A.eX(b)},
gu(a){return A.fi(this.a,A.eX(this))},
j(a){var s=B.a.af([A.am(this.$ti.c)],", ")
return this.a.j(0)+" with "+("<"+s+">")}}
A.aA.prototype={
$2(a,b){return this.a.$1$2(a,b,this.$ti.y[0])},
$S(){return A.jJ(A.ec(this.a),this.$ti)}}
A.bp.prototype={}
A.d7.prototype={
C(a){var s,r,q=this,p=new RegExp(q.a).exec(a)
if(p==null)return null
s=Object.create(null)
r=q.b
if(r!==-1)s.arguments=p[r+1]
r=q.c
if(r!==-1)s.argumentsExpr=p[r+1]
r=q.d
if(r!==-1)s.expr=p[r+1]
r=q.e
if(r!==-1)s.method=p[r+1]
r=q.f
if(r!==-1)s.receiver=p[r+1]
return s}}
A.bm.prototype={
j(a){return"Null check operator used on a null value"}}
A.c3.prototype={
j(a){var s,r=this,q="NoSuchMethodError: method not found: '",p=r.b
if(p==null)return"NoSuchMethodError: "+r.a
s=r.c
if(s==null)return q+p+"' ("+r.a+")"
return q+p+"' on '"+s+"' ("+r.a+")"}}
A.cm.prototype={
j(a){var s=this.a
return s.length===0?"Error":"Error: "+s}}
A.cV.prototype={
j(a){return"Throw of null ('"+(this.a===null?"null":"undefined")+"' from JavaScript)"}}
A.b5.prototype={}
A.bG.prototype={
j(a){var s,r=this.b
if(r!=null)return r
r=this.a
s=r!==null&&typeof r==="object"?r.stack:null
return this.b=s==null?"":s},
$iav:1}
A.L.prototype={
j(a){var s=this.constructor,r=s==null?null:s.name
return"Closure '"+A.h7(r==null?"unknown":r)+"'"},
$ia9:1,
gbm(){return this},
$C:"$1",
$R:1,
$D:null}
A.bT.prototype={$C:"$0",$R:0}
A.bU.prototype={$C:"$2",$R:2}
A.cj.prototype={}
A.ch.prototype={
j(a){var s=this.$static_name
if(s==null)return"Closure of unknown static method"
return"Closure '"+A.h7(s)+"'"}}
A.aP.prototype={
E(a,b){if(b==null)return!1
if(this===b)return!0
if(!(b instanceof A.aP))return!1
return this.$_target===b.$_target&&this.a===b.a},
gu(a){return(A.es(this.a)^A.ce(this.$_target))>>>0},
j(a){return"Closure '"+this.$_name+"' of "+("Instance of '"+A.cf(this.a)+"'")}}
A.cg.prototype={
j(a){return"RuntimeError: "+this.a}}
A.aB.prototype={
gk(a){return this.a},
gM(){return new A.bg(this,this.$ti.h("bg<1>"))},
H(a){var s=this.b
if(s==null)return!1
return s[a]!=null},
L(a,b){this.$ti.h("a0<1,2>").a(b).V(0,new A.cK(this))},
i(a,b){var s,r,q,p,o=null
if(typeof b=="string"){s=this.b
if(s==null)return o
r=s[b]
q=r==null?o:r.b
return q}else if(typeof b=="number"&&(b&0x3fffffff)===b){p=this.c
if(p==null)return o
r=p[b]
q=r==null?o:r.b
return q}else return this.bd(b)},
bd(a){var s,r,q=this.d
if(q==null)return null
s=this.aN(q,a)
r=this.aG(s,a)
if(r<0)return null
return s[r].b},
A(a,b,c){var s,r,q,p,o,n,m=this,l=m.$ti
l.c.a(b)
l.y[1].a(c)
if(typeof b=="string"){s=m.b
m.al(s==null?m.b=m.a6():s,b,c)}else if(typeof b=="number"&&(b&0x3fffffff)===b){r=m.c
m.al(r==null?m.c=m.a6():r,b,c)}else{q=m.d
if(q==null)q=m.d=m.a6()
p=J.b1(b)&1073741823
o=q[p]
if(o==null)q[p]=[m.a7(b,c)]
else{n=m.aG(o,b)
if(n>=0)o[n].b=c
else o.push(m.a7(b,c))}}},
V(a,b){var s,r,q=this
q.$ti.h("~(1,2)").a(b)
s=q.e
r=q.r
while(s!=null){b.$2(s.a,s.b)
if(r!==q.r)throw A.b(A.S(q))
s=s.c}},
al(a,b,c){var s,r=this.$ti
r.c.a(b)
r.y[1].a(c)
s=a[b]
if(s==null)a[b]=this.a7(b,c)
else s.b=c},
a7(a,b){var s=this,r=s.$ti,q=new A.cS(r.c.a(a),r.y[1].a(b))
if(s.e==null)s.e=s.f=q
else s.f=s.f.c=q;++s.a
s.r=s.r+1&1073741823
return q},
aN(a,b){return a[J.b1(b)&1073741823]},
aG(a,b){var s,r
if(a==null)return-1
s=a.length
for(r=0;r<s;++r)if(J.f2(a[r].a,b))return r
return-1},
j(a){return A.fg(this)},
a6(){var s=Object.create(null)
s["<non-identifier-key>"]=s
delete s["<non-identifier-key>"]
return s},
$ife:1}
A.cK.prototype={
$2(a,b){var s=this.a,r=s.$ti
s.A(0,r.c.a(a),r.y[1].a(b))},
$S(){return this.a.$ti.h("~(1,2)")}}
A.cS.prototype={}
A.bg.prototype={
gk(a){return this.a.a},
gv(a){var s=this.a
return new A.bf(s,s.r,s.e,this.$ti.h("bf<1>"))}}
A.bf.prototype={
gp(){return this.d},
n(){var s,r=this,q=r.a
if(r.b!==q.r)throw A.b(A.S(q))
s=r.c
if(s==null){r.d=null
return!1}else{r.d=s.a
r.c=s.c
return!0}},
$iX:1}
A.ej.prototype={
$1(a){return this.a(a)},
$S:14}
A.ek.prototype={
$2(a,b){return this.a(a,b)},
$S:31}
A.el.prototype={
$1(a){return this.a(A.G(a))},
$S:23}
A.cI.prototype={
j(a){return"RegExp/"+this.a+"/"+this.b.flags}}
A.aS.prototype={
gt(a){return B.A},
$io:1,
$iey:1}
A.bk.prototype={}
A.c4.prototype={
gt(a){return B.B},
$io:1,
$iez:1}
A.aT.prototype={
gk(a){return a.length},
$iT:1}
A.bi.prototype={$ik:1,$if:1,$in:1}
A.bj.prototype={$ik:1,$if:1,$in:1}
A.c5.prototype={
gt(a){return B.C},
$io:1,
$icC:1}
A.c6.prototype={
gt(a){return B.D},
$io:1,
$icD:1}
A.c7.prototype={
gt(a){return B.E},
$io:1,
$icF:1}
A.c8.prototype={
gt(a){return B.F},
$io:1,
$icG:1}
A.c9.prototype={
gt(a){return B.G},
$io:1,
$icH:1}
A.ca.prototype={
gt(a){return B.I},
$io:1,
$id9:1}
A.cb.prototype={
gt(a){return B.J},
$io:1,
$ida:1}
A.bl.prototype={
gt(a){return B.K},
gk(a){return a.length},
$io:1,
$idb:1}
A.cc.prototype={
gt(a){return B.L},
gk(a){return a.length},
$io:1,
$idc:1}
A.bC.prototype={}
A.bD.prototype={}
A.bE.prototype={}
A.bF.prototype={}
A.a1.prototype={
h(a){return A.dF(v.typeUniverse,this,a)},
m(a){return A.iv(v.typeUniverse,this,a)}}
A.ct.prototype={}
A.dD.prototype={
j(a){return A.N(this.a,null)}}
A.cs.prototype={
j(a){return this.a}}
A.aX.prototype={$iad:1}
A.dk.prototype={
$1(a){var s=this.a,r=s.a
s.a=null
r.$0()},
$S:7}
A.dj.prototype={
$1(a){var s,r
this.a.a=t.M.a(a)
s=this.b
r=this.c
s.firstChild?s.removeChild(r):s.appendChild(r)},
$S:32}
A.dl.prototype={
$0(){this.a.$0()},
$S:6}
A.dm.prototype={
$0(){this.a.$0()},
$S:6}
A.dB.prototype={
aM(a,b){if(self.setTimeout!=null)self.setTimeout(A.bO(new A.dC(this,b),0),a)
else throw A.b(A.dd("`setTimeout()` not found."))}}
A.dC.prototype={
$0(){this.b.$0()},
$S:0}
A.co.prototype={
ab(a){var s,r=this,q=r.$ti
q.h("1/?").a(a)
if(a==null)a=q.c.a(a)
if(!r.b)r.a.an(a)
else{s=r.a
if(q.h("az<1>").b(a))s.ao(a)
else s.ap(a)}},
ac(a,b){var s
if(b==null)b=A.cz(a)
s=this.a
if(this.b)s.a1(new A.W(a,b))
else s.a0(new A.W(a,b))}}
A.dM.prototype={
$1(a){return this.a.$2(0,a)},
$S:4}
A.dN.prototype={
$2(a,b){this.a.$2(1,new A.b5(a,t.l.a(b)))},
$S:29}
A.eb.prototype={
$2(a,b){this.a(A.E(a),b)},
$S:28}
A.W.prototype={
j(a){return A.h(this.a)},
$iw:1,
gO(){return this.b}}
A.cq.prototype={
ac(a,b){var s=this.a
if((s.a&30)!==0)throw A.b(A.ac("Future already completed"))
s.a0(A.iU(a,b))},
aE(a){return this.ac(a,null)}}
A.bw.prototype={
ab(a){var s,r=this.$ti
r.h("1/?").a(a)
s=this.a
if((s.a&30)!==0)throw A.b(A.ac("Future already completed"))
s.an(r.h("1/").a(a))}}
A.af.prototype={
bf(a){var s
if((this.c&15)!==6)return!0
s=this.b.b
return s.U(s,t.bG.a(this.d),a.a,t.y,t.K)},
ba(a){var s,r=this,q=r.e,p=null,o=t.z,n=t.K,m=a.a,l=r.b.b
if(t.Q.b(q))p=l.aY(l,q,m,a.b,o,n,t.l)
else p=l.U(l,t.v.a(q),m,o,n)
try{o=r.$ti.h("2/").a(p)
return o}catch(s){if(t.b7.b(A.aM(s))){if((r.c&1)!==0)throw A.b(A.I("The error handler of Future.then must return a value of the returned future's type","onError"))
throw A.b(A.I("The error handler of Future.catchError must return a value of the future's type","onError"))}else throw s}}}
A.z.prototype={
ag(a,b,c){var s,r,q,p=this.$ti
p.m(c).h("1/(2)").a(a)
s=$.v
if(s===B.d){if(b!=null&&!t.Q.b(b)&&!t.v.b(b))throw A.b(A.f4(b,"onError",u.c))}else{r=p.c
a=s.a9(s,c.h("@<0/>").m(r).h("1(2)").a(a),c.h("0/"),r)
if(b!=null)b=A.fP(b,s)}q=new A.z(s,c.h("z<0>"))
r=b==null?1:3
this.R(new A.af(q,r,a,b,p.h("@<1>").m(c).h("af<1,2>")))
return q},
bj(a,b){return this.ag(a,null,b)},
aA(a,b,c){var s,r=this.$ti
r.m(c).h("1/(2)").a(a)
s=new A.z($.v,c.h("z<0>"))
this.R(new A.af(s,19,a,b,r.h("@<1>").m(c).h("af<1,2>")))
return s},
aZ(a){this.a=this.a&1|16
this.c=a},
S(a){this.a=a.a&30|this.a&1
this.c=a.c},
R(a){var s,r=this,q=r.a
if(q<=3){a.a=t.F.a(r.c)
r.c=a}else{if((q&4)!==0){s=t._.a(r.c)
if((s.a&24)===0){s.R(a)
return}r.S(s)}q=r.b
q.K(q,new A.dq(r,a))}},
av(a){var s,r,q,p,o,n,m=this,l={}
l.a=a
if(a==null)return
s=m.a
if(s<=3){r=t.F.a(m.c)
m.c=a
if(r!=null){q=a.a
for(p=a;q!=null;p=q,q=o)o=q.a
p.a=r}}else{if((s&4)!==0){n=t._.a(m.c)
if((n.a&24)===0){n.av(a)
return}m.S(n)}l.a=m.T(a)
s=m.b
s.K(s,new A.du(l,m))}},
J(){var s=t.F.a(this.c)
this.c=null
return this.T(s)},
T(a){var s,r,q
for(s=a,r=null;s!=null;r=s,s=q){q=s.a
s.a=r}return r},
ap(a){var s,r=this
r.$ti.c.a(a)
s=r.J()
r.a=8
r.c=a
A.aF(r,s)},
aQ(a){var s=this.J()
this.S(a)
A.aF(this,s)},
a1(a){var s=this.J()
this.aZ(a)
A.aF(this,s)},
an(a){var s=this.$ti
s.h("1/").a(a)
if(s.h("az<1>").b(a)){this.ao(a)
return}this.aP(a)},
aP(a){var s,r=this
r.$ti.c.a(a)
r.a^=2
s=r.b
s.K(s,new A.ds(r,a))},
ao(a){A.eH(this.$ti.h("az<1>").a(a),this,!1)
return},
a0(a){var s
this.a^=2
s=this.b
s.K(s,new A.dr(this,a))},
$iaz:1}
A.dq.prototype={
$0(){A.aF(this.a,this.b)},
$S:0}
A.du.prototype={
$0(){A.aF(this.b,this.a.a)},
$S:0}
A.dt.prototype={
$0(){A.eH(this.a.a,this.b,!0)},
$S:0}
A.ds.prototype={
$0(){this.a.ap(this.b)},
$S:0}
A.dr.prototype={
$0(){this.a.a1(this.b)},
$S:0}
A.dx.prototype={
$0(){var s,r,q,p,o,n,m,l,k=this,j=null
try{q=k.a.a
p=q.b.b
j=p.az(p,t.bd.a(q.d),t.z)}catch(o){s=A.aM(o)
r=A.aJ(o)
if(k.c&&t.t.a(k.b.a.c).a===s){q=k.a
q.c=t.t.a(k.b.a.c)}else{q=s
p=r
if(p==null)p=A.cz(q)
n=k.a
n.c=new A.W(q,p)
q=n}q.b=!0
return}if(j instanceof A.z&&(j.a&24)!==0){if((j.a&16)!==0){q=k.a
q.c=t.t.a(j.c)
q.b=!0}return}if(j instanceof A.z){m=k.b.a
l=new A.z(m.b,m.$ti)
j.ag(new A.dy(l,m),new A.dz(l),t.H)
q=k.a
q.c=l
q.b=!1}},
$S:0}
A.dy.prototype={
$1(a){this.a.aQ(this.b)},
$S:7}
A.dz.prototype={
$2(a,b){A.bK(a)
t.l.a(b)
this.a.a1(new A.W(a,b))},
$S:25}
A.dw.prototype={
$0(){var s,r,q,p,o,n,m,l,k
try{q=this.a
p=q.a
o=p.$ti
n=o.c
m=n.a(this.b)
l=p.b.b
q.c=l.U(l,o.h("2/(1)").a(p.d),m,o.h("2/"),n)}catch(k){s=A.aM(k)
r=A.aJ(k)
q=s
p=r
if(p==null)p=A.cz(q)
o=this.a
o.c=new A.W(q,p)
o.b=!0}},
$S:0}
A.dv.prototype={
$0(){var s,r,q,p,o,n,m,l=this
try{s=t.t.a(l.a.a.c)
p=l.b
if(p.a.bf(s)&&p.a.e!=null){p.c=p.a.ba(s)
p.b=!1}}catch(o){r=A.aM(o)
q=A.aJ(o)
p=t.t.a(l.a.a.c)
if(p.a===r){n=l.b
n.c=p
p=n}else{p=r
n=q
if(n==null)n=A.cz(p)
m=l.b
m.c=new A.W(p,n)
p=m}p.b=!0}},
$S:0}
A.cp.prototype={}
A.bs.prototype={
gk(a){var s,r,q=this,p={},o=new A.z($.v,t.aQ)
p.a=0
s=q.$ti
r=s.h("~(1)?").a(new A.d5(p,q))
t.Y.a(new A.d6(p,o))
A.a5(q.a,q.b,r,!1,s.c)
return o}}
A.d5.prototype={
$1(a){this.b.$ti.c.a(a);++this.a.a},
$S(){return this.b.$ti.h("~(1)")}}
A.d6.prototype={
$0(){var s=this.b,r=s.$ti,q=r.h("1/").a(this.a.a),p=s.J()
r.c.a(q)
s.a=8
s.c=q
A.aF(s,p)},
$S:0}
A.cu.prototype={}
A.dg.prototype={
bi(a,b,c){var s,r,q,p,o=this
c.h("~(0)").a(a)
c.a(b)
try{q=o.U(o,a,b,t.H,c)
return q}catch(p){s=A.aM(p)
r=A.aJ(p)
o.a5(o,s,r)}},
b4(a,b){return new A.dh(this,this.aX(this,b.h("0()").a(a),b),b)},
b5(a,b){return new A.di(this,this.a9(this,b.h("~(0)").a(a),t.H,b),b)},
a5(a,b,c){var s,r,q,p,o,n,m,l
t.l.a(c)
s=null
if(s==null){A.jb(b,c)
return}r=s.gah()
q=r.gbn()
p=$.v
try{$.v=q
s.b9(r,r.ga8(),a,b,c)
$.v=p}catch(m){o=A.aM(m)
n=A.aJ(m)
$.v=p
l=b===o?c:n
q.a5(r,o,l)}},
az(a,b,c){var s,r,q
c.h("0()").a(b)
r=$.v
if(r===a)return b.$0()
s=r
$.v=a
try{r=b.$0()
return r}finally{$.v=s}q=null.gah()
return null.bo(q,q.ga8(),a,b)},
U(a,b,c,d,e){var s,r,q
d.h("@<0>").m(e).h("1(2)").a(b)
e.a(c)
r=$.v
if(r===a)return b.$1(c)
s=r
$.v=a
try{r=b.$1(c)
return r}finally{$.v=s}q=null.gah()
return null.b9(q,q.ga8(),a,b,c)},
aY(a,b,c,d,e,f,g){var s,r,q
e.h("@<0>").m(f).m(g).h("1(2,3)").a(b)
f.a(c)
g.a(d)
r=$.v
if(r===a)return b.$2(c,d)
s=r
$.v=a
try{r=b.$2(c,d)
return r}finally{$.v=s}q=null.gah()
return null.bp(q,q.ga8(),a,b,c,d)},
aX(a,b,c){c.h("0()").a(b)
return b},
a9(a,b,c,d){c.h("@<0>").m(d).h("1(2)").a(b)
return b},
aw(a,b,c,d,e){c.h("@<0>").m(d).m(e).h("1(2,3)").a(b)
return b},
aT(a,b,c){return null},
K(a,b){A.jc(a,t.M.a(b))
return}}
A.dh.prototype={
$0(){var s=this.a
return s.az(s,this.b,this.c)},
$S(){return this.c.h("0()")}}
A.di.prototype={
$1(a){var s=this.c
return this.a.bi(this.b,s.a(a),s)},
$S(){return this.c.h("~(0)")}}
A.e2.prototype={
$0(){A.hy(this.a,this.b)},
$S:0}
A.bz.prototype={
gk(a){return this.a},
gM(){return new A.bA(this,this.$ti.h("bA<1>"))},
H(a){var s,r
if(typeof a=="string"&&a!=="__proto__"){s=this.b
return s==null?!1:s[a]!=null}else if(typeof a=="number"&&(a&1073741823)===a){r=this.c
return r==null?!1:r[a]!=null}else return this.aR(a)},
aR(a){var s=this.d
if(s==null)return!1
return this.a4(this.au(s,a),a)>=0},
i(a,b){var s,r,q
if(typeof b=="string"&&b!=="__proto__"){s=this.b
r=s==null?null:A.ft(s,b)
return r}else if(typeof b=="number"&&(b&1073741823)===b){q=this.c
r=q==null?null:A.ft(q,b)
return r}else return this.aV(b)},
aV(a){var s,r,q=this.d
if(q==null)return null
s=this.au(q,a)
r=this.a4(s,a)
return r<0?null:s[r+1]},
A(a,b,c){var s,r,q,p,o,n,m=this,l=m.$ti
l.c.a(b)
l.y[1].a(c)
if(typeof b=="string"&&b!=="__proto__"){s=m.b
m.am(s==null?m.b=A.eI():s,b,c)}else if(typeof b=="number"&&(b&1073741823)===b){r=m.c
m.am(r==null?m.c=A.eI():r,b,c)}else{q=m.d
if(q==null)q=m.d=A.eI()
p=A.es(b)&1073741823
o=q[p]
if(o==null){A.eJ(q,p,[b,c]);++m.a
m.e=null}else{n=m.a4(o,b)
if(n>=0)o[n+1]=c
else{o.push(b,c);++m.a
m.e=null}}}},
V(a,b){var s,r,q,p,o,n,m=this,l=m.$ti
l.h("~(1,2)").a(b)
s=m.aq()
for(r=s.length,q=l.c,l=l.y[1],p=0;p<r;++p){o=s[p]
q.a(o)
n=m.i(0,o)
b.$2(o,n==null?l.a(n):n)
if(s!==m.e)throw A.b(A.S(m))}},
aq(){var s,r,q,p,o,n,m,l,k,j,i=this,h=i.e
if(h!=null)return h
h=A.ff(i.a,null,!1,t.z)
s=i.b
r=0
if(s!=null){q=Object.getOwnPropertyNames(s)
p=q.length
for(o=0;o<p;++o){h[r]=q[o];++r}}n=i.c
if(n!=null){q=Object.getOwnPropertyNames(n)
p=q.length
for(o=0;o<p;++o){h[r]=+q[o];++r}}m=i.d
if(m!=null){q=Object.getOwnPropertyNames(m)
p=q.length
for(o=0;o<p;++o){l=m[q[o]]
k=l.length
for(j=0;j<k;j+=2){h[r]=l[j];++r}}}return i.e=h},
am(a,b,c){var s=this.$ti
s.c.a(b)
s.y[1].a(c)
if(a[b]==null){++this.a
this.e=null}A.eJ(a,b,c)},
au(a,b){return a[A.es(b)&1073741823]}}
A.aW.prototype={
a4(a,b){var s,r,q
if(a==null)return-1
s=a.length
for(r=0;r<s;r+=2){q=a[r]
if(q==null?b==null:q===b)return r}return-1}}
A.bA.prototype={
gk(a){return this.a.a},
gv(a){var s=this.a
return new A.bB(s,s.aq(),this.$ti.h("bB<1>"))}}
A.bB.prototype={
gp(){var s=this.d
return s==null?this.$ti.c.a(s):s},
n(){var s=this,r=s.b,q=s.c,p=s.a
if(r!==p.e)throw A.b(A.S(p))
else if(q>=r.length){s.d=null
return!1}else{s.d=r[q]
s.c=q+1
return!0}},
$iX:1}
A.u.prototype={
gv(a){return new A.aa(a,a.length,A.aK(a).h("aa<u.E>"))},
B(a,b){if(!(b<a.length))return A.t(a,b)
return a[b]},
X(a,b,c){var s=A.aK(a)
return new A.y(a,s.m(c).h("1(u.E)").a(b),s.h("@<u.E>").m(c).h("y<1,2>"))},
j(a){return A.fc(a,"[","]")}}
A.ab.prototype={
V(a,b){var s,r,q,p=A.aj(this)
p.h("~(1,2)").a(b)
for(s=this.gM(),s=s.gv(s),p=p.y[1];s.n();){r=s.gp()
q=this.i(0,r)
b.$2(r,q==null?p.a(q):q)}},
be(a,b,c,d){var s,r,q,p,o,n=A.aj(this)
n.m(c).m(d).h("aD<1,2>(3,4)").a(b)
s=A.aC(c,d)
for(r=this.gM(),r=r.gv(r),n=n.y[1];r.n();){q=r.gp()
p=this.i(0,q)
o=b.$2(q,p==null?n.a(p):p)
s.A(0,o.a,o.b)}return s},
gk(a){var s=this.gM()
return s.gk(s)},
j(a){return A.fg(this)},
$ia0:1}
A.cT.prototype={
$2(a,b){var s,r=this.a
if(!r.a)this.b.a+=", "
r.a=!1
r=this.b
s=A.h(a)
r.a=(r.a+=s)+": "
s=A.h(b)
r.a+=s},
$S:12}
A.bW.prototype={
E(a,b){var s
if(b==null)return!1
s=!1
if(b instanceof A.bW)if(this.a===b.a)s=this.b===b.b
return s},
gu(a){return A.fi(this.a,this.b)},
j(a){var s=this,r=A.hv(A.hT(s)),q=A.bX(A.hR(s)),p=A.bX(A.hN(s)),o=A.bX(A.hO(s)),n=A.bX(A.hQ(s)),m=A.bX(A.hS(s)),l=A.fa(A.hP(s)),k=s.b,j=k===0?"":A.fa(k)
return r+"-"+q+"-"+p+" "+o+":"+n+":"+m+"."+l+j+"Z"}}
A.w.prototype={
gO(){return A.hM(this)}}
A.bR.prototype={
j(a){var s=this.a
if(s!=null)return"Assertion failed: "+A.cB(s)
return"Assertion failed"}}
A.ad.prototype={}
A.a4.prototype={
ga3(){return"Invalid argument"+(!this.a?"(s)":"")},
ga2(){return""},
j(a){var s=this,r=s.c,q=r==null?"":" ("+r+")",p=s.d,o=p==null?"":": "+p,n=s.ga3()+q+o
if(!s.a)return n
return n+s.ga2()+": "+A.cB(s.gae())},
gae(){return this.b}}
A.bn.prototype={
gae(){return A.fE(this.b)},
ga3(){return"RangeError"},
ga2(){var s,r=this.e,q=this.f
if(r==null)s=q!=null?": Not less than or equal to "+A.h(q):""
else if(q==null)s=": Not greater than or equal to "+A.h(r)
else if(q>r)s=": Not in inclusive range "+A.h(r)+".."+A.h(q)
else s=q<r?": Valid value range is empty":": Only valid value is "+A.h(r)
return s}}
A.bY.prototype={
gae(){return A.E(this.b)},
ga3(){return"RangeError"},
ga2(){if(A.E(this.b)<0)return": index must not be negative"
var s=this.f
if(s===0)return": no indices are valid"
return": index should be less than "+s},
gk(a){return this.f}}
A.bv.prototype={
j(a){return"Unsupported operation: "+this.a}}
A.cl.prototype={
j(a){return"UnimplementedError: "+this.a}}
A.br.prototype={
j(a){return"Bad state: "+this.a}}
A.bV.prototype={
j(a){var s=this.a
if(s==null)return"Concurrent modification during iteration."
return"Concurrent modification during iteration: "+A.cB(s)+"."}}
A.bq.prototype={
j(a){return"Stack Overflow"},
gO(){return null},
$iw:1}
A.dp.prototype={
j(a){return"Exception: "+this.a}}
A.cE.prototype={
j(a){var s=this.a,r=""!==s?"FormatException: "+s:"FormatException",q=this.b
if(typeof q=="string"){if(q.length>78)q=B.h.ak(q,0,75)+"..."
return r+"\n"+q}else return r}}
A.f.prototype={
X(a,b,c){var s=A.aj(this)
return A.hJ(this,s.m(c).h("1(f.E)").a(b),s.h("f.E"),c)},
gk(a){var s,r=this.gv(this)
for(s=0;r.n();)++s
return s},
B(a,b){var s,r
A.fl(b,"index")
s=this.gv(this)
for(r=b;s.n();){if(r===0)return s.gp();--r}throw A.b(A.eB(b,b-r,this,"index"))},
j(a){return A.hz(this,"(",")")}}
A.aD.prototype={
j(a){return"MapEntry("+this.a+": "+A.h(this.b)+")"}}
A.r.prototype={
gu(a){return A.c.prototype.gu.call(this,0)},
j(a){return"null"}}
A.c.prototype={$ic:1,
E(a,b){return this===b},
gu(a){return A.ce(this)},
j(a){return"Instance of '"+A.cf(this)+"'"},
gt(a){return A.jC(this)},
toString(){return this.j(this)}}
A.cv.prototype={
j(a){return""},
$iav:1}
A.ci.prototype={
gk(a){return this.a.length},
j(a){var s=this.a
return s.charCodeAt(0)==0?s:s}}
A.cU.prototype={
j(a){return"Promise was rejected with a value of `"+(this.a?"undefined":"null")+"`."}}
A.en.prototype={
$1(a){var s,r,q,p
if(A.fO(a))return a
s=this.a
if(s.H(a))return s.i(0,a)
if(a instanceof A.ab){r={}
s.A(0,a,r)
for(s=a.gM(),s=s.gv(s);s.n();){q=s.gp()
r[q]=this.$1(a.i(0,q))}return r}else if(t.R.b(a)){p=[]
s.A(0,a,p)
B.a.L(p,J.a_(a,this,t.z))
return p}else return a},
$S:11}
A.et.prototype={
$1(a){return this.a.ab(this.b.h("0/?").a(a))},
$S:4}
A.eu.prototype={
$1(a){if(a==null)return this.a.aE(new A.cU(a===undefined))
return this.a.aE(a)},
$S:4}
A.ed.prototype={
$1(a){var s,r,q,p,o,n,m,l,k,j,i,h,g
if(A.fN(a))return a
s=this.a
a.toString
if(s.H(a))return s.i(0,a)
if(a instanceof Date){r=a.getTime()
if(r<-864e13||r>864e13)A.m(A.bo(r,-864e13,864e13,"millisecondsSinceEpoch",null))
return new A.bW(r,0,!0)}if(a instanceof RegExp)throw A.b(A.I("structured clone of RegExp",null))
if(a instanceof Promise)return A.f0(a,t.X)
q=Object.getPrototypeOf(a)
if(q===Object.prototype||q===null){p=t.X
o=A.aC(p,p)
s.A(0,a,o)
n=Object.keys(a)
m=[]
for(s=n.length,l=0;l<n.length;n.length===s||(0,A.O)(n),++l)m.push(A.fV(n[l]))
for(k=0;k<n.length;++k){j=n[k]
if(!(k<m.length))return A.t(m,k)
i=m[k]
if(j!=null)o.A(0,i,this.$1(a[j]))}return o}if(a instanceof Array){h=a
o=[]
s.A(0,a,o)
g=A.E(a.length)
for(k=0;k<g;++k){if(!(k<h.length))return A.t(h,k)
o.push(this.$1(h[k]))}return o}return a},
$S:11}
A.cW.prototype={
$2(a,b){var s,r
A.G(a)
A.e(b)
s=this.a.i(0,a)
if(s!=null)return s.call(null,b)
r=this.b.i(0,a)
if(r!=null)return A.an(r.$1(b))
throw A.b(A.I("Unknown runtime handler: "+a,null))},
bc(){var s,r,q={}
q.version="0.1.0"
q.register=A.eO(new A.cZ(this))
q.call=A.eO(new A.d_(this))
s=new A.d0(this)
if(typeof s=="function")A.m(A.I("Attempting to rewrap a JS function.",null))
r=function(a,b){return function(){return a(b)}}(A.iF,s)
r[$.bQ()]=s
q.start=r
q.loadJson=A.fI(new A.d1())
q.setText=A.eO(new A.d2())
q.setAttribute=A.fI(new A.d3())
v.G.LMDart=q},
sbg(a){this.c=t.Y.a(a)}}
A.cZ.prototype={
$2(a,b){var s
A.G(a)
t.g.a(b)
s=this.a
if(a.length===0||s.b.H(a))A.m(A.I("Duplicate or empty runtime handler: "+a,null))
s.a.A(0,a,b)},
$S:13}
A.d_.prototype={
$2(a,b){return this.a.$2(A.G(a),A.e(b))},
$S:21}
A.d0.prototype={
$0(){var s=this.a.c
return s==null?null:s.$0()},
$S:0}
A.d1.prototype={
$3(a,b,c){var s,r,q,p
A.G(a)
s=t.g
s.a(b)
s.a(c)
s=A.Z(a).bj(new A.cX(b),t.P)
r=new A.cY(c)
q=s.$ti
p=$.v
if(p!==B.d)r=A.fP(r,p)
s.R(new A.af(new A.z(p,q),2,null,r,q.h("af<1,1>")))},
$S:15}
A.cX.prototype={
$1(a){this.a.call(null,A.an(a))},
$S:16}
A.cY.prototype={
$1(a){this.a.call(null,J.aN(A.bK(a)))},
$S:17}
A.d2.prototype={
$2(a,b){A.G(a)
A.G(b)
A.h5(a).textContent=b},
$S:18}
A.d3.prototype={
$3(a,b,c){A.G(a)
A.G(b)
A.G(c)
A.h5(a).setAttribute(b,c)},
$S:19}
A.aq.prototype={}
A.au.prototype={}
A.Q.prototype={}
A.at.prototype={}
A.ev.prototype={
$2(a,b){return A.a6(a)+t.J.a(b).b},
$S:20}
A.dO.prototype={
$1(a){return t.x.a(a).b},
$S:43}
A.dX.prototype={
$1(a){return t.p.a(a).c},
$S:22}
A.dY.prototype={
$1(a){return t.j.a(a).a},
$S:2}
A.dZ.prototype={
$1(a){return t.j.a(a).a},
$S:2}
A.e_.prototype={
$1(a){return t.j.a(a).b},
$S:2}
A.e0.prototype={
$1(a){return t.j.a(a).b},
$S:2}
A.e1.prototype={
$1(a){t.j.a(a)
return A.x(["x",this.a.D(0,a.a),"y",this.b.D(0,a.b)],t.N,t.i)},
$S:24}
A.ar.prototype={
F(a,b){var s=this.b.i(0,a)
return s==null?b:A.K(s,this.a+"."+a)},
q(a){return this.F(a,0)},
a_(a,b){var s,r=this.b.i(0,a)
if(r==null)s=b
else{if(typeof r!="string")A.m(A.l(this.a+"."+a+" must be a string",null))
s=r}return s},
P(a){return this.a_(a,"")},
aC(){var s=this.b.i(0,"points")
if(s==null)s=B.z
s=J.a_(A.a2(s,this.a+".points"),new A.cA(this),t.I)
s=A.U(s,s.$ti.h("q.E"))
return s}}
A.cA.prototype={
$1(a){var s=A.aC(t.N,t.X)
s.A(0,"type","point")
s.L(0,A.C(a,this.a.a+" point"))
return A.fb(s)},
$S:10}
A.e4.prototype={
$1(a){t.I.a(a)
return A.h(a.q("x"))+","+A.h(a.q("y"))},
$S:26}
A.eo.prototype={
$2(a,b){if(typeof a!="string")throw A.b(A.l(this.a+" has a nonstring key",null))
return new A.aD(a,b,t.bS)},
$S:27}
A.aR.prototype={
aj(a,b){var s,r,q,p,o,n,m,l,k,j=new Float32Array(16)
for(s=this.a,r=b.a,q=0;q<4;++q)for(p=q*4,o=0;o<4;++o){for(n=0,m=0;m<4;++m){l=m*4+o
if(!(l<16))return A.t(s,l)
l=s[l]
k=p+m
if(!(k<16))return A.t(r,k)
n+=l*r[k]}l=p+o
if(!(l<16))return A.t(j,l)
j[l]=n}return new A.aR(j)}}
A.cQ.prototype={
aL(a,b,c,d){var s=this,r=s.a,q=s.b,p=s.c,o=s.d
if(!B.a.b8(A.i([r,q,p,o],t.u),new A.cR())||q<=r||o===p)throw A.b(A.I("Scale domains must be finite and nonempty",null))},
D(a,b){var s=this,r=s.c,q=s.a
return r+(b-q)/(s.b-q)*(s.d-r)},
aI(a){var s,r,q,p,o,n,m,l,k
if(a<2)throw A.b(A.I("At least two ticks required",null))
s=this.b
r=this.a
q=(s-r)/(a-1)
p=A.hI(A.ib(q))
o=q/p
if(o<=1)n=1
else if(o<=2)n=2
else n=o<=5?5:10
m=n*p
l=A.i([],t.u)
k=B.b.b6(r/m)*m
for(s+=m*0.000001;k<=s;){B.a.l(l,A.jy(B.b.N(k,10)))
k+=m}return l},
aH(){return this.aI(6)}}
A.cR.prototype={
$1(a){return isFinite(A.a6(a))},
$S:36}
A.cL.prototype={
aK(a){var s,r,q,p=this.a.length
if(p===0)throw A.b(A.l("table must have columns",null))
for(s=this.b,r=s.length,q=0;q<r;++q)if(s[q].length!==p)throw A.b(A.l("table row length must match columns",null))},
b3(a,b){var s,r,q,p,o,n,m,l,k,j,i,h,g,f,e
t.cQ.a(b)
s=A.J(a.tHead)
if(s==null)s=A.e(a.createTHead())
s.textContent=""
r=A.e(s.insertRow())
for(q=this.a,p=q.length,o=v.G,n=0;n<q.length;q.length===p||(0,A.O)(q),++n){m=q[n]
l=A.e(A.e(o.document).createElement("th"))
l.textContent=m
A.e(r.appendChild(l))}k=A.J(A.e(a.tBodies).item(0))
if(k==null)k=A.e(a.createTBody())
k.textContent=""
for(q=this.b,p=t.a,o=p.h("~(1)?"),p=p.c,j=0;j<q.length;++j){i=A.e(k.insertRow())
i.setAttribute("data-row",""+j)
i.tabIndex=0
if(!(j<q.length))return A.t(q,j)
h=q[j]
g=h.length
n=0
for(;n<h.length;h.length===g||(0,A.O)(h),++n){f=h[n]
l=A.e(i.insertCell())
e=f==null?null:J.aN(f)
if(e==null)e=""
l.textContent=e}A.a5(i,"click",o.a(new A.cM(b,j)),!1,p)
A.a5(i,"keydown",o.a(new A.cN(b,j)),!1,p)}a.setAttribute("data-bound","true")}}
A.cO.prototype={
$1(a){if(typeof a!="string")A.m(A.l("table column must be a string",null))
return a},
$S:8}
A.cP.prototype={
$1(a){return A.a2(a,"table row")},
$S:30}
A.cM.prototype={
$1(a){return this.a.$1(this.b)},
$S:1}
A.cN.prototype={
$1(a){if(A.G(a.key)==="Enter"||A.G(a.key)===" ")this.a.$1(this.b)},
$S:1}
A.aO.prototype={}
A.aU.prototype={}
A.ck.prototype={
b2(a){var s,r=this
A.a6(a)
if(!r.e){s=r.r
if(s!=null)r.f=r.f+B.b.aD(a-s,0,50)
r.r=a
r.G()}A.E(A.e(v.G.window).requestAnimationFrame(A.cx(r.gaB())))},
G(){var s,r,q,p,o,n,m,l,k,j,i,h,g,f=this,e="Tween duration must be positive"
for(s=f.b,r=s.length,q=v.G,p=f.a,o=!isFinite(p),n=0;n<s.length;s.length===r||(0,A.O)(s),++n){m=s[n]
l=m.c
k=f.f
if(p<=0||o)A.m(A.I(e,null))
j=A.eU(k/p)
k=A.J(A.e(q.document).querySelector(m.a))
if(k!=null)k.setAttribute(m.b,A.h(l+(m.d-l)*j))}for(s=f.c,r=s.length,n=0;n<s.length;s.length===r||(0,A.O)(s),++n){m=s[n]
l=m.b
k=f.f
i=!(p<=0)
if(!i||o)A.m(A.I(e,null))
k/=p
j=A.eU(k)
h=m.c
if(!i||o)A.m(A.I(e,null))
g=A.eU(k)
k=A.J(A.e(q.document).querySelector(m.a))
if(k!=null)k.setAttribute("transform","translate("+A.h(l+(m.d-l)*j)+" "+A.h(h+(m.e-h)*g)+")")}f.d.$1(f.f/1000)}}
A.cn.prototype={
aW(a,b){var s,r,q,p,o,n="vertexAttribPointer"
t.f.a(b)
a.width=960
a.height=540
s=J.a_(A.a2(b.i(0,"colors"),"WebGL colors"),new A.df(),t.N)
r=A.U(s,s.$ti.h("q.E"))
if(r.length!==6)throw A.b(A.l("WebGL cube needs six colors",null))
s=this.a
s===$&&A.ew()
q=A.J(s.createBuffer())
q.toString
s.bindBuffer(34962,q)
s.bufferData(34962,A.i6(r),35044)
q=this.b
q===$&&A.ew()
s.useProgram(q)
p=A.E(s.getAttribLocation(q,"position"))
o=A.E(s.getAttribLocation(q,"color"))
s.enableVertexAttribArray(p)
s.enableVertexAttribArray(o)
q=t.H
A.eR(s,n,[p,3,5126,!1,24,0],q)
A.eR(s,n,[o,3,5126,!1,24,12],q)
s.enable(2929)
s.clearColor(0.027,0.063,0.11,1)
this.G()},
aU(a){var s,r=this
A.a6(a)
if(!r.r){s=r.f
if(s!=null)r.e=r.e+B.b.aD(a-s,0,50)/1000
r.f=a
r.G()}A.E(A.e(v.G.window).requestAnimationFrame(A.cx(r.gar())))},
G(){var s,r,q,p,o,n,m,l,k,j=this,i=1/Math.tan(0.5235987755982988),h=new Float32Array(16)
h[0]=i/1.7777777777777777
h[5]=i
h[10]=-1.002002002002002
h[11]=-1
h[14]=-0.20020020020020018
s=A.fh()
r=s.a
r.$flags&2&&A.bP(r)
r[12]=0
r[13]=0
r[14]=-4.2
r=new A.aR(h).aj(0,s)
q=j.e*j.d
p=q*0.7
o=Math.sin(p)
n=Math.cos(p)
m=Math.sin(q)
l=Math.cos(q)
q=A.fh().a
q.$flags&2&&A.bP(q)
q[0]=l
q[2]=-m
q[4]=m*o
q[5]=n
q[6]=l*o
q[8]=m*n
q[9]=-o
q[10]=l*n
k=r.aj(0,new A.aR(q))
q=j.a
q===$&&A.ew()
q.viewport(0,0,960,540)
q.clear(16640)
r=j.c
r===$&&A.ew()
q.uniformMatrix4fv(r,!1,k.a)
q.drawArrays(4,0,36)}}
A.df.prototype={
$1(a){if(typeof a!="string")A.m(A.l("WebGL color must be a string",null))
return a},
$S:8}
A.de.prototype={
$1(a){A.E(a)
return A.jK(B.h.ak(this.a,a,a+2),16)/255},
$S:33}
A.eA.prototype={}
A.bx.prototype={}
A.cr.prototype={}
A.by.prototype={$ii2:1}
A.dn.prototype={
$1(a){return this.a.$1(A.e(a))},
$S:1}
A.ep.prototype={
$1(a){var s=A.bL(A.e(a).value),r=s==null?null:s
return"Dart received "+(r==null?"empty":r)},
$S:34}
A.eq.prototype={
$0(){return A.a7()},
$S:0}
A.dU.prototype={
$1(a){$.ap().$2("hydrate.clicked",A.e(A.an(A.x(["value","hydration"],t.N,t.X))))},
$S:1}
A.e7.prototype={
$1(a){var s=$.ap(),r=this.a.b
if(!(a<r.length))return A.t(r,a)
r=r[a]
if(0>=r.length)return A.t(r,0)
s.$2("table.selected",A.e(A.an(A.x(["index",a,"name",r[0]],t.N,t.X))))},
$S:35}
A.e5.prototype={
$1(a){var s=A.G($.ap().$2("svg.palette",A.e(A.an(A.aC(t.N,t.X)))))
A.eg(A.F("scene"),this.a,s)
A.a8("SVG redrawn from JSON with JavaScript-selected color "+s+".")},
$S:1}
A.dQ.prototype={
$1(a){var s,r=this,q=r.a,p=A.e(q.getBoundingClientRect()),o=A.a6(a.offsetX)*A.E(q.width)/A.a6(p.width),n=A.a6(a.offsetY)*A.E(q.height)/A.a6(p.height)
if(A.cw($.ap().$2("canvas.point",A.e(A.an(A.x(["x",o,"y",n],t.N,t.X))))))B.a.l(r.b,A.e(new v.G.DOMPoint(o,n)))
s=r.b
A.ef(q,r.c,s)
A.a8("Canvas redrawn with "+s.length+" JavaScript-approved pointer mark(s).")},
$S:1}
A.dR.prototype={
$1(a){B.a.b7(this.a)
A.ef(this.b,this.c,B.m)
A.a8("Canvas pointer marks cleared.")},
$S:1}
A.dI.prototype={
$1(a){return A.j7(this.a,a)},
$S:5}
A.dJ.prototype={
$1(a){var s=this.a,r=!s.e
s.e=r
s.r=null
$.ap().$2("animation.toggled",A.e(A.an(A.x(["paused",r],t.N,t.X))))},
$S:1}
A.dK.prototype={
$1(a){var s=this.a
s.f=0
s.r=null
s.G()
$.ap().$2("animation.reset",A.e(A.an(A.aC(t.N,t.X))))},
$S:1}
A.e9.prototype={
$1(a){var s=this.a,r=!s.r
s.r=r
s.f=null
$.ap().$2("animation.toggled",A.e(A.an(A.x(["paused",r],t.N,t.X))))},
$S:1}
A.ea.prototype={
$1(a){var s=this.a
s.e=0
s.f=null
s.G()
$.ap().$2("animation.reset",A.e(A.an(A.aC(t.N,t.X))))},
$S:1};(function aliases(){var s=J.as.prototype
s.aJ=s.j})();(function installTearOffs(){var s=hunkHelpers._static_1,r=hunkHelpers._static_0,q=hunkHelpers._instance_1u,p=hunkHelpers.installStaticTearOff
s(A,"jp","i8",3)
s(A,"jq","i9",3)
s(A,"jr","ia",3)
r(A,"fT","jg",0)
s(A,"js","hn",37)
s(A,"jv","i0",38)
s(A,"jt","hK",39)
s(A,"ju","i_",40)
s(A,"jz","hw",10)
s(A,"jU","hm",41)
s(A,"jV","hL",42)
q(A.ck.prototype,"gaB","b2",5)
q(A.cn.prototype,"gar","aU",5)
p(A,"jP",2,null,["$1$2","$2"],["h1",function(a,b){return A.h1(a,b,t.n)}],9,0)
p(A,"jO",2,null,["$1$2","$2"],["h0",function(a,b){return A.h0(a,b,t.n)}],9,0)})();(function inheritance(){var s=hunkHelpers.mixin,r=hunkHelpers.inherit,q=hunkHelpers.inheritMany
r(A.c,null)
q(A.c,[A.eD,J.c_,A.bp,J.b2,A.w,A.d4,A.f,A.aa,A.bh,A.b7,A.b4,A.M,A.L,A.d7,A.cV,A.b5,A.bG,A.ab,A.cS,A.bf,A.cI,A.a1,A.ct,A.dD,A.dB,A.co,A.W,A.cq,A.af,A.z,A.cp,A.bs,A.cu,A.dg,A.bB,A.u,A.bW,A.bq,A.dp,A.cE,A.aD,A.r,A.cv,A.ci,A.cU,A.cW,A.aq,A.au,A.Q,A.at,A.ar,A.aR,A.cQ,A.cL,A.aO,A.aU,A.ck,A.cn,A.eA,A.by])
q(J.c_,[J.c1,J.b9,J.bc,J.bb,J.bd,J.ba,J.aQ])
q(J.bc,[J.as,J.A,A.aS,A.bk])
q(J.as,[J.cd,J.bu,J.P])
r(J.c0,A.bp)
r(J.cJ,J.A)
q(J.ba,[J.b8,J.c2])
q(A.w,[A.be,A.ad,A.c3,A.cm,A.cg,A.cs,A.bR,A.a4,A.bv,A.cl,A.br,A.bV])
q(A.f,[A.k,A.aE,A.b6])
q(A.k,[A.q,A.bg,A.bA])
q(A.q,[A.bt,A.y])
r(A.b3,A.aE)
q(A.L,[A.bZ,A.bT,A.bU,A.cj,A.ej,A.el,A.dk,A.dj,A.dM,A.dy,A.d5,A.di,A.en,A.et,A.eu,A.ed,A.d1,A.cX,A.cY,A.d3,A.dO,A.dX,A.dY,A.dZ,A.e_,A.e0,A.e1,A.cA,A.e4,A.cR,A.cO,A.cP,A.cM,A.cN,A.df,A.de,A.dn,A.ep,A.dU,A.e7,A.e5,A.dQ,A.dR,A.dI,A.dJ,A.dK,A.e9,A.ea])
r(A.aA,A.bZ)
r(A.bm,A.ad)
q(A.cj,[A.ch,A.aP])
q(A.ab,[A.aB,A.bz])
q(A.bU,[A.cK,A.ek,A.dN,A.eb,A.dz,A.cT,A.cZ,A.d_,A.d2,A.ev,A.eo])
q(A.bk,[A.c4,A.aT])
q(A.aT,[A.bC,A.bE])
r(A.bD,A.bC)
r(A.bi,A.bD)
r(A.bF,A.bE)
r(A.bj,A.bF)
q(A.bi,[A.c5,A.c6])
q(A.bj,[A.c7,A.c8,A.c9,A.ca,A.cb,A.bl,A.cc])
r(A.aX,A.cs)
q(A.bT,[A.dl,A.dm,A.dC,A.dq,A.du,A.dt,A.ds,A.dr,A.dx,A.dw,A.dv,A.d6,A.dh,A.e2,A.d0,A.eq])
r(A.bw,A.cq)
r(A.aW,A.bz)
q(A.a4,[A.bn,A.bY])
r(A.bx,A.bs)
r(A.cr,A.bx)
s(A.bC,A.u)
s(A.bD,A.M)
s(A.bE,A.u)
s(A.bF,A.M)})()
var v={G:typeof self!="undefined"?self:globalThis,typeUniverse:{eC:new Map(),tR:{},eT:{},tPV:{},sEA:[]},mangledGlobalNames:{a:"int",d:"double",ao:"num",j:"String",aH:"bool",r:"Null",n:"List",c:"Object",a0:"Map",p:"JSObject"},mangledNames:{},types:["~()","~(p)","d(Q)","~(~())","~(@)","~(d)","r()","r(@)","j(c?)","0^(0^,0^)<ao>","ar(c?)","c?(c?)","~(c?,c?)","r(j,P)","@(@)","r(j,P,P)","r(c?)","r(c)","r(j,j)","r(j,j,j)","d(d,au)","c?(j,p)","n<Q>(at)","@(j)","a0<j,d>(Q)","r(c,av)","j(ar)","aD<j,c?>(@,@)","~(a,@)","r(@,av)","n<c?>(c?)","@(@,j)","r(~())","d(a)","j(p)","~(a)","aH(d)","aq(c?)","au(c?)","Q(c?)","at(c?)","aO(c?)","aU(c?)","d(aq)"],interceptorsByTag:null,leafTags:null,arrayRti:Symbol("$ti")}
A.iu(v.typeUniverse,JSON.parse('{"P":"as","cd":"as","bu":"as","jY":"aS","c1":{"aH":[],"o":[]},"b9":{"r":[],"o":[]},"bc":{"p":[]},"as":{"p":[]},"A":{"n":["1"],"k":["1"],"p":[],"f":["1"]},"c0":{"bp":[]},"cJ":{"A":["1"],"n":["1"],"k":["1"],"p":[],"f":["1"]},"b2":{"X":["1"]},"ba":{"d":[],"ao":[]},"b8":{"d":[],"a":[],"ao":[],"o":[]},"c2":{"d":[],"ao":[],"o":[]},"aQ":{"j":[],"o":[]},"be":{"w":[]},"k":{"f":["1"]},"q":{"k":["1"],"f":["1"]},"bt":{"q":["1"],"k":["1"],"f":["1"],"f.E":"1","q.E":"1"},"aa":{"X":["1"]},"aE":{"f":["2"],"f.E":"2"},"b3":{"aE":["1","2"],"k":["2"],"f":["2"],"f.E":"2"},"bh":{"X":["2"]},"y":{"q":["2"],"k":["2"],"f":["2"],"f.E":"2","q.E":"2"},"b6":{"f":["2"],"f.E":"2"},"b7":{"X":["2"]},"b4":{"X":["1"]},"bZ":{"L":[],"a9":[]},"aA":{"L":[],"a9":[]},"bm":{"ad":[],"w":[]},"c3":{"w":[]},"cm":{"w":[]},"bG":{"av":[]},"L":{"a9":[]},"bT":{"L":[],"a9":[]},"bU":{"L":[],"a9":[]},"cj":{"L":[],"a9":[]},"ch":{"L":[],"a9":[]},"aP":{"L":[],"a9":[]},"cg":{"w":[]},"aB":{"ab":["1","2"],"fe":["1","2"],"a0":["1","2"]},"bg":{"k":["1"],"f":["1"],"f.E":"1"},"bf":{"X":["1"]},"aS":{"p":[],"ey":[],"o":[]},"bk":{"p":[]},"c4":{"ez":[],"p":[],"o":[]},"aT":{"T":["1"],"p":[]},"bi":{"u":["d"],"n":["d"],"T":["d"],"k":["d"],"p":[],"f":["d"],"M":["d"]},"bj":{"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"]},"c5":{"cC":[],"u":["d"],"n":["d"],"T":["d"],"k":["d"],"p":[],"f":["d"],"M":["d"],"o":[],"u.E":"d"},"c6":{"cD":[],"u":["d"],"n":["d"],"T":["d"],"k":["d"],"p":[],"f":["d"],"M":["d"],"o":[],"u.E":"d"},"c7":{"cF":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"c8":{"cG":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"c9":{"cH":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"ca":{"d9":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"cb":{"da":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"bl":{"db":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"cc":{"dc":[],"u":["a"],"n":["a"],"T":["a"],"k":["a"],"p":[],"f":["a"],"M":["a"],"o":[],"u.E":"a"},"cs":{"w":[]},"aX":{"ad":[],"w":[]},"W":{"w":[]},"bw":{"cq":["1"]},"z":{"az":["1"]},"bz":{"ab":["1","2"],"a0":["1","2"]},"aW":{"bz":["1","2"],"ab":["1","2"],"a0":["1","2"]},"bA":{"k":["1"],"f":["1"],"f.E":"1"},"bB":{"X":["1"]},"ab":{"a0":["1","2"]},"d":{"ao":[]},"a":{"ao":[]},"n":{"k":["1"],"f":["1"]},"bR":{"w":[]},"ad":{"w":[]},"a4":{"w":[]},"bn":{"w":[]},"bY":{"w":[]},"bv":{"w":[]},"cl":{"w":[]},"br":{"w":[]},"bV":{"w":[]},"bq":{"w":[]},"cv":{"av":[]},"bx":{"bs":["1"]},"cr":{"bx":["1"],"bs":["1"]},"by":{"i2":["1"]},"cH":{"n":["a"],"k":["a"],"f":["a"]},"dc":{"n":["a"],"k":["a"],"f":["a"]},"db":{"n":["a"],"k":["a"],"f":["a"]},"cF":{"n":["a"],"k":["a"],"f":["a"]},"d9":{"n":["a"],"k":["a"],"f":["a"]},"cG":{"n":["a"],"k":["a"],"f":["a"]},"da":{"n":["a"],"k":["a"],"f":["a"]},"cC":{"n":["d"],"k":["d"],"f":["d"]},"cD":{"n":["d"],"k":["d"],"f":["d"]}}'))
A.it(v.typeUniverse,JSON.parse('{"k":1,"aT":1}'))
var u={c:"Error handler must accept one Object or one Object and a StackTrace as arguments, and return a value of the returned future's type"}
var t=(function rtii(){var s=A.eh
return{t:s("W"),h:s("aO"),x:s("aq"),D:s("ey"),e:s("ez"),I:s("ar"),r:s("k<@>"),C:s("w"),E:s("cC"),q:s("cD"),Z:s("a9"),B:s("aA<d>"),G:s("cF"),k:s("cG"),U:s("cH"),R:s("f<@>"),O:s("A<p>"),a2:s("A<n<d>>"),bM:s("A<a0<j,c?>>"),s:s("A<j>"),u:s("A<d>"),b:s("A<@>"),c4:s("A<a>"),T:s("b9"),m:s("p"),g:s("P"),da:s("T<@>"),c:s("n<@>"),W:s("n<c?>"),bS:s("aD<j,c?>"),f:s("a0<j,c?>"),V:s("y<a,d>"),P:s("r"),K:s("c"),j:s("Q"),bH:s("aU"),L:s("jZ"),p:s("at"),J:s("au"),l:s("av"),N:s("j"),bW:s("o"),b7:s("ad"),c0:s("d9"),bk:s("da"),ca:s("db"),bX:s("dc"),o:s("bu"),a:s("cr<p>"),_:s("z<@>"),aQ:s("z<a>"),A:s("aW<c?,c?>"),y:s("aH"),bG:s("aH(c)"),i:s("d"),bs:s("d(a)"),z:s("@"),bd:s("@()"),v:s("@(c)"),Q:s("@(c,av)"),S:s("a"),bc:s("az<r>?"),b1:s("p?"),X:s("c?"),d:s("c?(p)"),w:s("j?"),F:s("af<@,@>?"),cG:s("aH?"),dd:s("d?"),a3:s("a?"),ae:s("ao?"),Y:s("~()?"),n:s("ao"),H:s("~"),M:s("~()"),cQ:s("~(a)"),aS:s("~(a,@)")}})();(function constants(){var s=hunkHelpers.makeConstList
B.w=J.c_.prototype
B.a=J.A.prototype
B.c=J.b8.prototype
B.b=J.ba.prototype
B.h=J.aQ.prototype
B.x=J.P.prototype
B.y=J.bc.prototype
B.n=J.cd.prototype
B.i=J.bu.prototype
B.f=new A.aA(A.jO(),t.B)
B.j=new A.aA(A.jP(),t.B)
B.o=new A.b4(A.eh("b4<0&>"))
B.k=function getTagFallback(o) {
  var s = Object.prototype.toString.call(o);
  return s.substring(8, s.length - 1);
}
B.p=function() {
  var toStringFunction = Object.prototype.toString;
  function getTag(o) {
    var s = toStringFunction.call(o);
    return s.substring(8, s.length - 1);
  }
  function getUnknownTag(object, tag) {
    if (/^HTML[A-Z].*Element$/.test(tag)) {
      var name = toStringFunction.call(object);
      if (name == "[object Object]") return null;
      return "HTMLElement";
    }
  }
  function getUnknownTagGenericBrowser(object, tag) {
    if (object instanceof HTMLElement) return "HTMLElement";
    return getUnknownTag(object, tag);
  }
  function prototypeForTag(tag) {
    if (typeof window == "undefined") return null;
    if (typeof window[tag] == "undefined") return null;
    var constructor = window[tag];
    if (typeof constructor != "function") return null;
    return constructor.prototype;
  }
  function discriminator(tag) { return null; }
  var isBrowser = typeof HTMLElement == "function";
  return {
    getTag: getTag,
    getUnknownTag: isBrowser ? getUnknownTagGenericBrowser : getUnknownTag,
    prototypeForTag: prototypeForTag,
    discriminator: discriminator };
}
B.v=function(getTagFallback) {
  return function(hooks) {
    if (typeof navigator != "object") return hooks;
    var userAgent = navigator.userAgent;
    if (typeof userAgent != "string") return hooks;
    if (userAgent.indexOf("DumpRenderTree") >= 0) return hooks;
    if (userAgent.indexOf("Chrome") >= 0) {
      function confirm(p) {
        return typeof window == "object" && window[p] && window[p].name == p;
      }
      if (confirm("Window") && confirm("HTMLElement")) return hooks;
    }
    hooks.getTag = getTagFallback;
  };
}
B.q=function(hooks) {
  if (typeof dartExperimentalFixupGetTag != "function") return hooks;
  hooks.getTag = dartExperimentalFixupGetTag(hooks.getTag);
}
B.u=function(hooks) {
  if (typeof navigator != "object") return hooks;
  var userAgent = navigator.userAgent;
  if (typeof userAgent != "string") return hooks;
  if (userAgent.indexOf("Firefox") == -1) return hooks;
  var getTag = hooks.getTag;
  var quickMap = {
    "BeforeUnloadEvent": "Event",
    "DataTransfer": "Clipboard",
    "GeoGeolocation": "Geolocation",
    "Location": "!Location",
    "WorkerMessageEvent": "MessageEvent",
    "XMLDocument": "!Document"};
  function getTagFirefox(o) {
    var tag = getTag(o);
    return quickMap[tag] || tag;
  }
  hooks.getTag = getTagFirefox;
}
B.t=function(hooks) {
  if (typeof navigator != "object") return hooks;
  var userAgent = navigator.userAgent;
  if (typeof userAgent != "string") return hooks;
  if (userAgent.indexOf("Trident/") == -1) return hooks;
  var getTag = hooks.getTag;
  var quickMap = {
    "BeforeUnloadEvent": "Event",
    "DataTransfer": "Clipboard",
    "HTMLDDElement": "HTMLElement",
    "HTMLDTElement": "HTMLElement",
    "HTMLPhraseElement": "HTMLElement",
    "Position": "Geoposition"
  };
  function getTagIE(o) {
    var tag = getTag(o);
    var newTag = quickMap[tag];
    if (newTag) return newTag;
    if (tag == "Object") {
      if (window.DataView && (o instanceof window.DataView)) return "DataView";
    }
    return tag;
  }
  function prototypeForTagIE(tag) {
    var constructor = window[tag];
    if (constructor == null) return null;
    return constructor.prototype;
  }
  hooks.getTag = getTagIE;
  hooks.prototypeForTag = prototypeForTagIE;
}
B.r=function(hooks) {
  var getTag = hooks.getTag;
  var prototypeForTag = hooks.prototypeForTag;
  function getTagFixed(o) {
    var tag = getTag(o);
    if (tag == "Document") {
      if (!!o.xmlVersion) return "!Document";
      return "!HTMLDocument";
    }
    return tag;
  }
  function prototypeForTagFixed(tag) {
    if (tag == "Document") return null;
    return prototypeForTag(tag);
  }
  hooks.getTag = getTagFixed;
  hooks.prototypeForTag = prototypeForTagFixed;
}
B.l=function(hooks) { return hooks; }

B.M=new A.d4()
B.d=new A.dg()
B.e=new A.cv()
B.m=s([],t.O)
B.z=s([],t.b)
B.A=A.a3("ey")
B.B=A.a3("ez")
B.C=A.a3("cC")
B.D=A.a3("cD")
B.E=A.a3("cF")
B.F=A.a3("cG")
B.G=A.a3("cH")
B.H=A.a3("c")
B.I=A.a3("d9")
B.J=A.a3("da")
B.K=A.a3("db")
B.L=A.a3("dc")})();(function staticFields(){$.dA=null
$.V=A.i([],A.eh("A<c>"))
$.fj=null
$.f7=null
$.f6=null
$.fZ=null
$.fS=null
$.h3=null
$.ee=null
$.em=null
$.eY=null
$.aY=null
$.bM=null
$.bN=null
$.eQ=!1
$.v=B.d})();(function lazyInitializers(){var s=hunkHelpers.lazyFinal
s($,"jX","h8",()=>A.ei("_$dart_dartClosure"))
s($,"jW","bQ",()=>A.ei("_$dart_dartClosure_dartJSInterop"))
s($,"kc","hk",()=>A.i([new J.c0()],A.eh("A<bp>")))
s($,"k0","h9",()=>A.ae(A.d8({
toString:function(){return"$receiver$"}})))
s($,"k1","ha",()=>A.ae(A.d8({$method$:null,
toString:function(){return"$receiver$"}})))
s($,"k2","hb",()=>A.ae(A.d8(null)))
s($,"k3","hc",()=>A.ae(function(){var $argumentsExpr$="$arguments$"
try{null.$method$($argumentsExpr$)}catch(r){return r.message}}()))
s($,"k6","hf",()=>A.ae(A.d8(void 0)))
s($,"k7","hg",()=>A.ae(function(){var $argumentsExpr$="$arguments$"
try{(void 0).$method$($argumentsExpr$)}catch(r){return r.message}}()))
s($,"k5","he",()=>A.ae(A.fp(null)))
s($,"k4","hd",()=>A.ae(function(){try{null.$method$}catch(r){return r.message}}()))
s($,"k9","hi",()=>A.ae(A.fp(void 0)))
s($,"k8","hh",()=>A.ae(function(){try{(void 0).$method$}catch(r){return r.message}}()))
s($,"ka","f1",()=>A.i7())
s($,"kb","hj",()=>A.es(B.H))
s($,"kd","ap",()=>{var r=t.N
return new A.cW(A.aC(r,t.g),A.aC(r,t.d))})})();(function nativeSupport(){!function(){var s=function(a){var m={}
m[a]=1
return Object.keys(hunkHelpers.convertToFastObject(m))[0]}
v.getIsolateTag=function(a){return s("___dart_"+a+v.isolateTag)}
var r="___dart_isolate_tags_"
var q=Object[r]||(Object[r]=Object.create(null))
var p="_ZxYxX"
for(var o=0;;o++){var n=s(p+"_"+o+"_")
if(!(n in q)){q[n]=1
v.isolateTag=n
break}}v.dispatchPropertyName=v.getIsolateTag("dispatch_record")}()
hunkHelpers.setOrUpdateInterceptorsByTag({ArrayBuffer:A.aS,SharedArrayBuffer:A.aS,ArrayBufferView:A.bk,DataView:A.c4,Float32Array:A.c5,Float64Array:A.c6,Int16Array:A.c7,Int32Array:A.c8,Int8Array:A.c9,Uint16Array:A.ca,Uint32Array:A.cb,Uint8ClampedArray:A.bl,CanvasPixelArray:A.bl,Uint8Array:A.cc})
hunkHelpers.setOrUpdateLeafTags({ArrayBuffer:true,SharedArrayBuffer:true,ArrayBufferView:false,DataView:true,Float32Array:true,Float64Array:true,Int16Array:true,Int32Array:true,Int8Array:true,Uint16Array:true,Uint32Array:true,Uint8ClampedArray:true,CanvasPixelArray:true,Uint8Array:false})
A.aT.$nativeSuperclassTag="ArrayBufferView"
A.bC.$nativeSuperclassTag="ArrayBufferView"
A.bD.$nativeSuperclassTag="ArrayBufferView"
A.bi.$nativeSuperclassTag="ArrayBufferView"
A.bE.$nativeSuperclassTag="ArrayBufferView"
A.bF.$nativeSuperclassTag="ArrayBufferView"
A.bj.$nativeSuperclassTag="ArrayBufferView"})()
Function.prototype.$0=function(){return this()}
Function.prototype.$1=function(a){return this(a)}
Function.prototype.$2=function(a,b){return this(a,b)}
Function.prototype.$3=function(a,b,c){return this(a,b,c)}
Function.prototype.$4=function(a,b,c,d){return this(a,b,c,d)}
Function.prototype.$5=function(a,b,c,d,e){return this(a,b,c,d,e)}
Function.prototype.$6=function(a,b,c,d,e,f){return this(a,b,c,d,e,f)}
Function.prototype.$1$1=function(a){return this(a)}
convertAllToFastObject(w)
convertToFastObject($);(function(a){if(typeof document==="undefined"){a(null)
return}if(typeof document.currentScript!="undefined"){a(document.currentScript)
return}var s=document.scripts
function onLoad(b){for(var q=0;q<s.length;++q){s[q].removeEventListener("load",onLoad,false)}a(b.target)}for(var r=0;r<s.length;++r){s[r].addEventListener("load",onLoad,false)}})(function(a){v.currentScript=a
var s=A.jM
if(typeof dartMainRunner==="function"){dartMainRunner(s,[])}else{s([])}})})()
//# sourceMappingURL=lmdart.js.map
