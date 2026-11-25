const $ = s => document.querySelector(s);
const money = n => "EGP " + Number(n).toFixed(2);
const seed = [
{id:1,name:"Vitamin C 1000mg",category:"Vitamins",description:"Daily vitamin C supplement.",price:180,stock:30,image:"https://images.unsplash.com/photo-1550572017-edd951b55104?w=600",featured:1,active:1},
{id:2,name:"Moisturizing Hand Cream",category:"Personal Care",description:"Everyday skin care essential.",price:95,stock:24,image:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",featured:1,active:1},
{id:3,name:"Digital Thermometer",category:"Devices",description:"Easy-to-use digital thermometer.",price:220,stock:15,image:"https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600",featured:1,active:1},
{id:4,name:"First Aid Kit",category:"Devices",description:"Compact first aid essentials.",price:350,stock:12,image:"https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600",featured:0,active:1},
{id:5,name:"Aloe Vera Gel",category:"Personal Care",description:"Soothing daily care gel.",price:75,stock:40,image:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",featured:0,active:1},
{id:6,name:"Cough Syrup",category:"Medicines",description:"Illustrative product. Ask a pharmacist before use.",price:70,stock:22,image:"https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600",featured:0,active:1}
];
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
let products=read("medicare_products",seed), cart=read("medicare_cart",[]), category="All";
if(!localStorage.getItem("medicare_products"))localStorage.setItem("medicare_products",JSON.stringify(products));
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function loadProducts(){
 const q=$("#searchInput").value.trim().toLowerCase(), sort=$("#sortSelect").value;
 let list=products.filter(p=>p.active!==0&&(category==="All"||p.category===category)&&(p.name.toLowerCase().includes(q)||p.description.toLowerCase().includes(q)));
 if(sort==="price-low")list.sort((a,b)=>a.price-b.price);else if(sort==="price-high")list.sort((a,b)=>b.price-a.price);else if(sort==="name")list.sort((a,b)=>a.name.localeCompare(b.name));else list.sort((a,b)=>b.featured-a.featured);
 $("#productGrid").innerHTML=list.map(p=>`<article class="product-card"><div class="product-image">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.display='none'">`:"<span class='placeholder'>✚</span>"}<span class="product-tag">${p.stock>0?(p.featured?"POPULAR":esc(p.category)):"OUT OF STOCK"}</span></div><div class="product-info"><span class="product-category">${esc(p.category)}</span><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="product-bottom"><span class="product-price">${money(p.price)}</span><button class="add-btn" data-add="${p.id}" ${p.stock<1?"disabled":""}>＋ Add</button></div></div></article>`).join("");
 $("#emptyState").classList.toggle("hidden",list.length>0);
}
function saveCart(){localStorage.setItem("medicare_cart",JSON.stringify(cart));renderCart()}
function renderCart(){
 const details=cart.map(i=>{const p=products.find(x=>x.id===i.id&&x.active!==0);return p?{...p,quantity:i.quantity}:null}).filter(Boolean);
 const count=details.reduce((s,p)=>s+p.quantity,0),subtotal=details.reduce((s,p)=>s+p.price*p.quantity,0);
 $("#cartCount").textContent=count;$("#cartSubtotal").textContent=money(subtotal);$("#checkoutTotal").textContent=money(subtotal+(subtotal>=500||!subtotal?0:25));
 $("#cartItems").innerHTML=details.length?details.map(p=>`<div class="cart-row"><div><strong>${esc(p.name)}</strong><small>${money(p.price)} each · ${money(p.price*p.quantity)}</small></div><div class="qty-controls"><button data-qty="${p.id}" data-delta="-1">−</button><span>${p.quantity}</span><button data-qty="${p.id}" data-delta="1" ${p.quantity>=p.stock?"disabled":""}>＋</button><button data-remove="${p.id}" aria-label="Remove">×</button></div></div>`).join(""):"<p class='empty'>Your cart is empty.</p>";
 $("#checkoutBtn").disabled=!details.length;
}
function openCart(){$("#overlay").classList.remove("hidden");$("#cartDrawer").classList.add("open")}
function closeCart(){$("#overlay").classList.add("hidden");$("#cartDrawer").classList.remove("open")}
$("#productGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;const id=Number(b.dataset.add),p=products.find(x=>x.id===id),i=cart.find(x=>x.id===id);if(i){if(i.quantity>=p.stock)return;i.quantity++}else cart.push({id,quantity:1});saveCart()});
$("#cartItems").addEventListener("click",e=>{const q=e.target.closest("[data-qty]"),r=e.target.closest("[data-remove]");if(r)cart=cart.filter(i=>i.id!==Number(r.dataset.remove));if(q){const i=cart.find(x=>x.id===Number(q.dataset.qty));i.quantity+=Number(q.dataset.delta);if(i.quantity<1)cart=cart.filter(x=>x!==i)}saveCart()});
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;category=b.dataset.category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));loadProducts()});
let searchTimer;$("#searchInput").addEventListener("input",()=>{clearTimeout(searchTimer);searchTimer=setTimeout(loadProducts,150)});$("#sortSelect").addEventListener("change",loadProducts);
$("#openCart").addEventListener("click",openCart);$("#closeCart").addEventListener("click",closeCart);$("#overlay").addEventListener("click",closeCart);
$("#checkoutBtn").addEventListener("click",()=>{closeCart();$("#checkoutModal").classList.remove("hidden")});
document.addEventListener("click",e=>{const b=e.target.closest("[data-close]");if(b)$("#"+b.dataset.close).classList.add("hidden")});
$("#checkoutForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget),items=cart.map(i=>{const p=products.find(x=>x.id===i.id);return {...p,quantity:i.quantity}}),subtotal=items.reduce((s,p)=>s+p.price*p.quantity,0);if(!items.length)return;const order={id:Date.now(),customer_name:f.get("name"),email:f.get("email"),phone:f.get("phone"),address:f.get("address"),notes:f.get("notes"),items:items.map(p=>({product_name:p.name,price:p.price,quantity:p.quantity})),subtotal,total:subtotal+(subtotal>=500?0:25),delivery_fee:subtotal>=500?0:25,status:"Pending",created_at:new Date().toISOString()};const orders=read("medicare_orders",[]);orders.unshift(order);localStorage.setItem("medicare_orders",JSON.stringify(orders));items.forEach(p=>{const x=products.find(y=>y.id===p.id);x.stock-=p.quantity});localStorage.setItem("medicare_products",JSON.stringify(products));cart=[];saveCart();e.currentTarget.reset();$("#checkoutModal").classList.add("hidden");$("#successMessage").textContent="Demo order #"+order.id+" saved in this browser. No payment or delivery is processed." ;$("#successModal").classList.remove("hidden");loadProducts()});
$("#contactForm").addEventListener("submit",e=>{e.preventDefault();$("#contactFeedback").textContent="Thanks! This demo form does not send messages to a real inbox.";e.currentTarget.reset()});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));$("#mainNav").addEventListener("click",e=>{if(e.target.tagName==="A")$("#mainNav").classList.remove("open")});
$("#year").textContent=new Date().getFullYear();loadProducts();renderCart();