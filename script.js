const products=[
{id:1,name:"Daily Vitamin C",category:"Vitamins",price:12.5,emoji:"🍊",color:"#f9ead8",tag:"BESTSELLER",description:"Sample vitamin supplement listing.",stock:24,rating:4.8},
{id:2,name:"Vitamin D3",category:"Vitamins",price:15,emoji:"☀️",color:"#f8f0d7",tag:"DAILY CARE",description:"Sample wellness product.",stock:18,rating:4.7},
{id:3,name:"Gentle Hand Cream",category:"Personal Care",price:8.75,emoji:"🧴",color:"#e8e4f4",tag:"SOFT & GENTLE",description:"Sample personal-care product.",stock:32,rating:4.6},
{id:4,name:"Hydrating Face Cream",category:"Personal Care",price:18,emoji:"🫧",color:"#dceef0",tag:"NEW",description:"Sample skincare item.",stock:12,rating:4.9},
{id:5,name:"First Aid Kit",category:"First Aid",price:22,emoji:"🩹",color:"#f5e2df",tag:"ESSENTIAL",description:"Sample first-aid kit listing.",stock:15,rating:4.8},
{id:6,name:"Cotton Bandages",category:"First Aid",price:6.5,emoji:"🩹",color:"#e8eee5",tag:"EVERYDAY",description:"Sample first-aid accessory.",stock:40,rating:4.5},
{id:7,name:"Herbal Wellness Tea",category:"Wellness",price:9.25,emoji:"🍵",color:"#e1eddf",tag:"FEEL GOOD",description:"Sample herbal tea listing.",stock:20,rating:4.4},
{id:8,name:"Relaxing Eye Mask",category:"Wellness",price:11,emoji:"😌",color:"#e8e5f1",tag:"SELF CARE",description:"Sample self-care accessory.",stock:16,rating:4.6},
{id:9,name:"Digital Thermometer",category:"Devices",price:14.5,emoji:"🌡️",color:"#e0edf2",tag:"POPULAR",description:"Sample health device.",stock:10,rating:4.7},
{id:10,name:"Reusable Hot Water Bottle",category:"Wellness",price:16,emoji:"🫙",color:"#f2e5dc",tag:"COMFORT",description:"Sample comfort accessory.",stock:9,rating:4.5},
{id:11,name:"Soft Toothbrush Set",category:"Personal Care",price:5.5,emoji:"🪥",color:"#e1efed",tag:"VALUE PACK",description:"Sample oral-care product.",stock:28,rating:4.3},
{id:12,name:"Adhesive Dressing Pack",category:"First Aid",price:7.25,emoji:"➕",color:"#f4e9dd",tag:"FIRST AID",description:"Sample first-aid supplies.",stock:22,rating:4.6}
];
const $=id=>document.getElementById(id),money=n=>"$"+n.toFixed(2);
let cart=JSON.parse(localStorage.getItem("medicare-cart")||"[]"),activeCategory="All",activeSort="featured";
let orders=JSON.parse(localStorage.getItem("medicare-orders")||"[]");
function saveCart(){localStorage.setItem("medicare-cart",JSON.stringify(cart))}
function toast(message){const t=$("toast");t.textContent=message;t.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.classList.remove("show"),2300)}
function renderProducts(){
 const q=$("searchInput").value.trim().toLowerCase();
 let shown=products.filter(p=>(activeCategory==="All"||p.category===activeCategory)&&(p.name+" "+p.category+" "+p.description).toLowerCase().includes(q));
 if(activeSort==="price-low")shown.sort((a,b)=>a.price-b.price);
 if(activeSort==="price-high")shown.sort((a,b)=>b.price-a.price);
 if(activeSort==="name")shown.sort((a,b)=>a.name.localeCompare(b.name));
 $("productGrid").innerHTML=shown.length?shown.map(p=>'<article class="product-card"><div class="product-art" style="background:'+p.color+'"><span class="product-tag">'+p.tag+'</span><span class="emoji">'+p.emoji+'</span></div><div class="product-info"><small>'+p.category+' · ★ '+p.rating+'</small><h3>'+p.name+'</h3><p class="product-description">'+p.description+'</p><div class="stock-line">'+p.stock+' in demo stock</div><div class="product-bottom"><span class="price">'+money(p.price)+'</span><button class="add-btn" data-add="'+p.id+'" aria-label="Add '+p.name+' to cart">+</button></div></div></article>').join(""):'<div class="empty-results">No products found. Try another search.</div>';
}
function renderCart(){
 const count=cart.reduce((s,i)=>s+i.qty,0),total=cart.reduce((s,i)=>s+i.price*i.qty,0);
 $("cartCount").textContent=count;$("cartSubtotal").textContent=money(total);
 $("cartItems").innerHTML=cart.length?cart.map(i=>'<div class="cart-row"><div class="cart-thumb" style="background:'+i.color+'">'+i.emoji+'</div><div><b>'+i.name+'</b><small>'+money(i.price)+' each</small><div class="qty"><button data-qty="'+i.id+'" data-delta="-1">−</button><span>'+i.qty+'</span><button data-qty="'+i.id+'" data-delta="1">+</button></div></div><b>'+money(i.price*i.qty)+'</b></div>').join(""):'<p class="empty-cart">Your cart is empty. Add something you love!</p>';
 $("checkoutBtn").disabled=!cart.length;saveCart();
}
function openCart(){$("cartDrawer").classList.add("open");$("cartOverlay").classList.add("open");$("cartDrawer").setAttribute("aria-hidden","false")}
function closeCart(){$("cartDrawer").classList.remove("open");$("cartOverlay").classList.remove("open");$("cartDrawer").setAttribute("aria-hidden","true")}
function closeCheckout(){$("checkoutModal").classList.remove("open");$("checkoutModal").setAttribute("aria-hidden","true")}
$("filters").addEventListener("click",e=>{const b=e.target.closest("[data-category]");if(!b)return;activeCategory=b.dataset.category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProducts()});
$("searchInput").addEventListener("input",renderProducts);
$("productGrid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(!b)return;const p=products.find(x=>x.id===Number(b.dataset.add)),item=cart.find(x=>x.id===p.id);if(item)item.qty++;else cart.push({...p,qty:1});renderCart();toast(p.name+" added to cart")});
$("cartItems").addEventListener("click",e=>{const b=e.target.closest("[data-qty]");if(!b)return;const item=cart.find(x=>x.id===Number(b.dataset.qty));item.qty+=Number(b.dataset.delta);if(item.qty<=0)cart=cart.filter(x=>x.id!==item.id);renderCart()});
$("openCart").addEventListener("click",openCart);$("closeCart").addEventListener("click",closeCart);$("cartOverlay").addEventListener("click",closeCart);
$("checkoutBtn").addEventListener("click",()=>{if(!cart.length)return;closeCart();$("checkoutTotal").textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0));$("checkoutModal").classList.add("open");$("checkoutModal").setAttribute("aria-hidden","false")});
$("closeCheckout").addEventListener("click",closeCheckout);
$("checkoutForm").addEventListener("submit",e=>{
 e.preventDefault();if(!cart.length)return;
 const d=Object.fromEntries(new FormData(e.target).entries()),total=cart.reduce((s,i)=>s+i.price*i.qty,0);
 const order={id:"MC-"+Date.now().toString().slice(-8),date:new Date().toLocaleString(),customer:d.customerName,email:d.customerEmail,phone:d.phone,city:d.city,address:d.address,delivery:d.delivery,payment:d.payment,items:cart.map(i=>({name:i.name,price:i.price,qty:i.qty})),total,status:"Demo order received"};
 orders.unshift(order);localStorage.setItem("medicare-orders",JSON.stringify(orders));cart=[];renderCart();closeCheckout();e.target.reset();
 $("orderNumber").textContent=order.id;$("orderMessage").textContent="Thanks, "+order.customer+". Your sample order for "+money(total)+" has been saved locally.";
 $("orderModal").classList.add("open");$("orderModal").setAttribute("aria-hidden","false");
});
$("continueShopping").addEventListener("click",()=>{$("orderModal").classList.remove("open");$("orderModal").setAttribute("aria-hidden","true");$("products").scrollIntoView({behavior:"smooth"})});
$("viewOrders").addEventListener("click",()=>{alert(orders.length?orders.map(o=>o.id+" | "+o.date+" | "+money(o.total)+" | "+o.status).join("\\n"):"No demo orders yet.")});
$("contactForm").addEventListener("submit",e=>{e.preventDefault();$("formMessage").textContent="Thanks! This is a demo form; no message was sent.";e.target.reset()});
$("menuToggle").addEventListener("click",()=>{const open=$("mainNav").classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",String(open));$("menuToggle").textContent=open?"×":"☰"});
$("mainNav").addEventListener("click",e=>{if(e.target.tagName==="A"){$("mainNav").classList.remove("open");$("menuToggle").setAttribute("aria-expanded","false");$("menuToggle").textContent="☰"}});
const sort=document.createElement("label");sort.className="sort-wrap";sort.innerHTML='Sort by <select id="sortSelect"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select>';$("filters").after(sort);
$("sortSelect").addEventListener("change",e=>{activeSort=e.target.value;renderProducts()});
renderProducts();renderCart();