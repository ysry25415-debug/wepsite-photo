import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Download, Image as ImageIcon,
  LayoutDashboard, Loader2, LockKeyhole, LogOut, Menu, Package, Plus,
  ShieldCheck, Trash2, Upload, X
} from 'lucide-react'
import { supabase } from './lib/supabase'

const DEFAULT_CATALOG = {
  heroTitle: 'Make your space feel like home.',
  heroText: 'Curated frames, wall art, and limited offers delivered across Egypt.',
  promotion: 'Shop our newest wall-art offers — delivery available across Egypt',
  slides: [
    { title: 'Summer wall refresh', subtitle: 'Save on selected gallery frames this week', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1600&q=85' },
    { title: 'A home with a point of view', subtitle: 'Discover pieces made to live with you', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85' },
    { title: 'Frames for the stories you keep', subtitle: 'Premium materials, beautifully made in Egypt', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85' },
    { title: 'New arrivals for every room', subtitle: 'Make your wall the centre of attention', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85' }
  ],
  bestSellers: [
    { name: 'Sands of Siwa', detail: 'A warm landscape print for calm, modern interiors.', price: 690, oldPrice: 790, image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80', images: ['https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80'], sizes: [{ label: 'A4 · 21 × 29.7 cm', price: 490 }, { label: 'A3 · 29.7 × 42 cm', price: 690 }, { label: '50 × 70 cm', price: 890 }] },
    { name: 'Quiet Lines', detail: 'Minimal art that makes a quiet but memorable statement.', price: 490, oldPrice: 590, image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80', images: ['https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80'], sizes: [{ label: 'A4 · 21 × 29.7 cm', price: 490 }, { label: '50 × 70 cm', price: 790 }] },
    { name: 'The Golden Hour', detail: 'Bring the gentle glow of sunset into your favourite room.', price: 690, oldPrice: null, image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80', images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80'], sizes: [{ label: 'A3 · 29.7 × 42 cm', price: 690 }, { label: '50 × 70 cm', price: 890 }] },
    { name: 'Stillness', detail: 'An evergreen mountain view for spaces that need room to breathe.', price: 490, oldPrice: 550, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80', images: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80'], sizes: [{ label: 'A4 · 21 × 29.7 cm', price: 490 }, { label: 'A3 · 29.7 × 42 cm', price: 690 }] }
  ],
  categories: [
    { name: 'Decor', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80' },
    { name: 'Nature', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80' },
    { name: 'Quotes', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80' },
    { name: 'Movies', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80' }
  ],
  prices: { classic: 690, forex: 490 }
}

const sizes = [
  { id: 'A4', label: 'A4', detail: '21 × 29.7 cm', hint: 'Perfect for shelves', scale: 'h-14 w-10' },
  { id: 'A3', label: 'A3', detail: '29.7 × 42 cm', hint: 'A beautiful focal point', scale: 'h-20 w-14' },
  { id: '50x70', label: '50 × 70', detail: '50 × 70 cm', hint: 'Made for a statement wall', scale: 'h-24 w-[4.25rem]' }
]

const frameOptions = [
  { id: 'classic', name: 'Classic Wood Frame', sub: 'Acrylic glass · warm oak', price: 690 },
  { id: 'forex', name: 'Borderless Forex Board', sub: 'Modern matte finish · 5mm', price: 490 }
]

function currency(value) { return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value) }

export default function App() {
  const [view, setView] = useState('shop')
  const [adminOpen, setAdminOpen] = useState(false)
  const [session, setSession] = useState(null)
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.ctrlKey && event.altKey && event.code === 'KeyO') {
        event.preventDefault()
        setAdminOpen(true)
      }
    }
    const openFromSecretLink = () => {
      if (window.location.hash.toLowerCase() === '#oasis-admin') setAdminOpen(true)
    }
    openFromSecretLink()
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', openFromSecretLink)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', openFromSecretLink)
    }
  }, [])

  useEffect(() => {
    supabase.from('store_settings').select('value').eq('key', 'catalog').maybeSingle()
      .then(({ data }) => { if (data?.value) setCatalog({ ...DEFAULT_CATALOG, ...data.value }) })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setView('shop')
  }

  if (view === 'admin' && session) return <AdminDashboard catalog={catalog} setCatalog={setCatalog} onExit={() => setView('shop')} onSignOut={signOut} />
  return <>
    <Shop catalog={catalog} />
    {adminOpen && <AdminLogin onClose={() => setAdminOpen(false)} onSuccess={() => { setAdminOpen(false); setView('admin') }} />}
  </>
}

function Shop({ catalog }) {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  if (selectedProduct) return <ProductPage product={selectedProduct} onBack={() => setSelectedProduct(null)} />
  return <main>
    <div className="border-b border-gray-100 bg-mist px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-gray-600 sm:text-xs">{catalog.promotion}</div>
    <header className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5">
      <a href="#top" className="font-serif text-xl font-bold tracking-[.18em]">OASIS</a>
      <a href="#best-sellers" className="touch bg-ink px-4 py-2 text-sm text-white">Shop offers</a>
    </header>
    <section id="top" className="mx-auto max-w-6xl px-5 pb-12 pt-4 md:pt-7"><OfferSlideshow slides={catalog.slides || DEFAULT_CATALOG.slides} /></section>
    <section id="best-sellers" className="mx-auto max-w-6xl px-5 pb-14"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Customer favourites</p><h2 className="mt-2 text-2xl font-semibold">Best sellers</h2><p className="mt-2 text-sm text-gray-600">Tap a product to see photos, sizes and full details.</p></div><span className="hidden text-sm text-gray-500 sm:block">Prices set by OASIS</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{(catalog.bestSellers || []).map((item, index) => <button key={`${item.name}-${index}`} onClick={() => setSelectedProduct(item)} className="overflow-hidden rounded-xl border border-gray-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-gallery"><div className="relative"><img src={item.images?.[0] || item.image} alt={item.name} className="aspect-[.85] w-full object-cover" />{item.oldPrice && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-ink">Offer</span>}</div><div className="p-3"><h3 className="text-sm font-semibold">{item.name}</h3><p className="mt-1 truncate text-xs text-gray-500">{item.detail}</p><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-sm font-bold">from {currency(item.price)}</span>{item.oldPrice && <span className="text-xs text-gray-400 line-through">{currency(item.oldPrice)}</span>}</div></div></button>)}</div></section>
    <section className="border-y border-gray-100 bg-mist py-14">
      <div className="mx-auto max-w-6xl px-5"><div className="mb-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Shop by style</p><h2 className="mt-2 text-2xl font-semibold">Find your point of view</h2></div></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{catalog.categories.map((item) => <button key={item.name} onClick={() => setCustomizerOpen(true)} className="group overflow-hidden rounded-xl bg-white text-left"><img src={item.image} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /><span className="block px-3 py-3 text-sm font-semibold">{item.name}</span></button>)}</div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-14"><div className="rounded-2xl bg-ink px-6 py-9 text-white sm:flex sm:items-center sm:justify-between sm:px-9"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">A personal touch</p><h2 className="mt-2 text-2xl font-semibold">Want to frame your own photo?</h2><p className="mt-2 text-sm text-gray-300">Our custom design service is always available when you need it.</p></div><button onClick={() => setCustomizerOpen(true)} className="touch mt-6 bg-white text-ink sm:mt-0">Design a custom frame</button></div></section>
    <footer className="border-t border-gray-100 px-5 py-8 text-center text-xs text-gray-500">© 2026 OASIS Frames · Made with care in Egypt</footer>
    {customizerOpen && <Customizer catalog={catalog} onClose={() => setCustomizerOpen(false)} />}
  </main>
}

function OfferSlideshow({ slides }) {
  const [active, setActive] = useState(0)
  const [pausedByCustomer, setPausedByCustomer] = useState(false)
  const touchStart = useRef(null)
  const safeActive = slides.length ? active % slides.length : 0
  const chooseSlide = (next) => { setActive((next + slides.length) % slides.length); setPausedByCustomer(true) }
  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setTimeout(() => {
      setActive(current => (current + 1) % slides.length)
      setPausedByCustomer(false)
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [safeActive, slides.length, pausedByCustomer])
  if (!slides.length) return <div className="flex aspect-[4/5] items-end rounded-2xl bg-ink p-7 text-white shadow-gallery sm:aspect-[16/8] sm:p-10"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">OASIS</p><h1 className="mt-2 text-3xl font-semibold sm:text-5xl">New offers coming soon.</h1><p className="mt-2 text-sm text-gray-300">Add a home offer from the admin dashboard.</p></div></div>
  const slide = slides[safeActive]
  const onTouchEnd = (event) => { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) < 35) { setPausedByCustomer(true); return } chooseSlide(safeActive + (distance < 0 ? 1 : -1)) }
  return <div onTouchStart={event => { touchStart.current = event.touches[0].clientX }} onTouchEnd={onTouchEnd} className="relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-2xl bg-gray-100 shadow-gallery sm:aspect-[16/8]">{slides.map((item, index) => <img draggable="false" key={`${item.image}-${index}`} src={item.image} alt={item.title} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${index === safeActive ? 'opacity-100' : 'opacity-0'}`} />)}<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/75">OASIS offers</p><h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">{slide.title}</h1><p className="mt-2 max-w-md text-sm text-white/90 sm:text-base">{slide.subtitle}</p><a href="#best-sellers" className="touch mt-5 inline-flex items-center gap-2 bg-white text-ink">Shop now <ArrowRight size={17} /></a></div><div className="absolute right-5 top-5 flex gap-1.5">{slides.map((_, index) => <button key={index} aria-label={`Show offer ${index + 1}`} onClick={() => chooseSlide(index)} className={`h-2 rounded-full transition-all ${index === safeActive ? 'w-6 bg-white' : 'w-2 bg-white/55'}`} />)}</div></div>
}

function productGallery(product) { return product.images?.filter(Boolean)?.length ? product.images.filter(Boolean) : [product.image].filter(Boolean) }
function productSizes(product) { return product.sizes?.length ? product.sizes : [{ label: 'Standard size', price: product.price }] }
function ProductPage({ product, onBack }) {
  const images = productGallery(product)
  const sizesForProduct = productSizes(product)
  const [activeImage, setActiveImage] = useState(images[0])
  const [selectedSize, setSelectedSize] = useState(sizesForProduct[0])
  const [checkout, setCheckout] = useState(false)
  if (checkout) return <ProductCheckout product={product} selectedImage={activeImage} selectedSize={selectedSize} onBack={() => setCheckout(false)} onDone={onBack} />
  return <main className="min-h-screen bg-white"><header className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between border-b border-gray-100 px-5"><button onClick={onBack} className="touch -ml-3 flex items-center gap-1 px-3 text-sm"><ArrowLeft size={17} /> Back to shop</button><span className="font-serif text-lg font-bold tracking-[.18em]">OASIS</span></header><section className="mx-auto max-w-6xl px-5 py-6 md:grid md:grid-cols-2 md:gap-12 md:py-12"><div><div className="overflow-hidden rounded-2xl bg-mist"><img src={activeImage} alt={product.name} className="aspect-[.9] w-full object-cover" /></div>{images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{images.map((image, index) => <button key={`${image}-${index}`} onClick={() => setActiveImage(image)} className={`h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${image === activeImage ? 'border-sand' : 'border-transparent'}`}><img src={image} alt={`${product.name} option ${index + 1}`} className="h-full w-full object-cover" /></button>)}</div>}</div><div className="mt-7 md:mt-0"><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">OASIS collection</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1><p className="mt-3 text-base leading-7 text-gray-600">{product.detail}</p><div className="mt-5 flex items-center gap-3"><span className="text-2xl font-semibold">{currency(selectedSize.price ?? product.price)}</span>{product.oldPrice && <span className="text-sm text-gray-400 line-through">{currency(product.oldPrice)}</span>}</div><div className="mt-8 border-t border-gray-100 pt-6"><div className="flex items-center justify-between"><h2 className="font-semibold">Choose your size</h2><span className="text-xs text-gray-500">Select one option</span></div><div className="mt-3 grid grid-cols-2 gap-2">{sizesForProduct.map((size, index) => <button key={`${size.label}-${index}`} onClick={() => setSelectedSize(size)} className={`choice min-h-16 p-3 ${selectedSize.label === size.label ? 'border-sand bg-[#FCFAF7] ring-1 ring-sand' : ''}`}><span className="block font-semibold">{size.label}</span><span className="mt-1 block text-xs text-gray-500">{currency(size.price ?? product.price)}</span></button>)}</div></div><div className="mt-8 rounded-xl bg-mist p-4 text-sm text-gray-600"><p className="font-semibold text-ink">Order with confidence</p><p className="mt-1">Cash on delivery, InstaPay, or Vodafone Cash. We will confirm your order by phone.</p></div><button onClick={() => setCheckout(true)} className="touch mt-5 flex w-full items-center justify-center gap-2 bg-ink py-4 text-white">Buy now <ArrowRight size={18} /></button></div></section></main>
}

function ProductCheckout({ product, selectedImage, selectedSize, onBack, onDone }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '', governorate: '', payment_method: 'Cash on Delivery' })
  const [status, setStatus] = useState('')
  const price = selectedSize.price ?? product.price
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  async function submitOrder(event) { event.preventDefault(); setStatus('loading'); const { error } = await supabase.from('orders').insert({ customer_name: form.name, phone: form.phone, address: form.address, governorate: form.governorate, payment_method: form.payment_method, product_name: product.name, product_image_url: product.images?.[0] || product.image, selected_product_image_url: selectedImage, selected_product_size: selectedSize.label, selected_frame_type: product.name, selected_size: selectedSize.label, uploaded_image_url: selectedImage, order_status: 'New', total: price }); setStatus(error ? error.message : 'success') }
  if (status === 'success') return <main className="flex min-h-screen items-center justify-center bg-mist p-5"><div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-gallery"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={27} /></div><h1 className="mt-5 text-3xl font-semibold">Your order is confirmed.</h1><p className="mt-3 text-sm leading-6 text-gray-600">Thank you. We will call you shortly to confirm delivery details.</p><button onClick={onDone} className="touch mt-7 bg-ink text-white">Back to shop</button></div></main>
  return <main className="min-h-screen bg-mist"><header className="mx-auto flex h-[4.5rem] max-w-2xl items-center px-5"><button onClick={onBack} className="touch -ml-3 flex items-center gap-1 px-3 text-sm"><ArrowLeft size={17} /> Back</button></header><form onSubmit={submitOrder} className="mx-auto max-w-2xl px-5 pb-10"><div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Quick checkout</p><h1 className="mt-2 text-3xl font-semibold">Delivery details</h1><div className="mt-5 flex gap-3 border-b border-gray-100 pb-5"><img src={selectedImage} alt="" className="h-16 w-14 rounded-lg object-cover" /><div><p className="font-semibold">{product.name}</p><p className="mt-1 text-sm text-gray-500">{selectedSize.label}</p><p className="mt-1 text-sm font-semibold">{currency(price)}</p></div></div><div className="mt-5 space-y-3"><input required name="name" value={form.name} onChange={update} className="field" placeholder="Full name" /><input required name="phone" type="tel" inputMode="tel" value={form.phone} onChange={update} className="field" placeholder="Mobile phone (01XXXXXXXXX)" /><textarea required name="address" value={form.address} onChange={update} className="field min-h-28 py-3" placeholder="Full address: building, street, area, apartment" /><select required name="governorate" value={form.governorate} onChange={update} className="field text-gray-500"><option value="" disabled>Select governorate</option>{['Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Other'].map(x => <option key={x}>{x}</option>)}</select><select name="payment_method" value={form.payment_method} onChange={update} className="field"><option>Cash on Delivery</option><option>InstaPay Transfer</option><option>Vodafone Cash</option></select></div><button disabled={status === 'loading'} className="touch mt-6 flex w-full items-center justify-center gap-2 bg-ink py-4 text-white disabled:bg-gray-400">{status === 'loading' ? <><Loader2 className="animate-spin" size={18} /> Placing order…</> : `Confirm order · ${currency(price)}`}</button>{status && status !== 'loading' && <p className="mt-3 text-sm text-red-600">{status}</p>}</div></form></main>
}

function Customizer({ catalog, onClose }) {
  const [step, setStep] = useState(1)
  const [source, setSource] = useState('upload')
  const [frame, setFrame] = useState('classic')
  const [size, setSize] = useState('A3')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', address: '', governorate: '', payment_method: 'Cash on Delivery' })
  const [status, setStatus] = useState('')
  const inputRef = useRef()
  const selectedFrame = frameOptions.find((item) => item.id === frame)
  const selectedSize = sizes.find((item) => item.id === size)
  const price = catalog.prices?.[frame] ?? selectedFrame.price

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])
  const setImage = (newFile) => { if (!newFile?.type?.startsWith('image/')) return; if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); setFile(newFile); setPreview(URL.createObjectURL(newFile)); setSource('upload') }
  const selectArt = (image) => { setPreview(image); setFile(null); setSource('art') }

  async function submitOrder(event) {
    event.preventDefault()
    setStatus('loading')
    try {
      let uploadedImageUrl = preview || null
      if (file) {
        const extension = file.name.split('.').pop() || 'jpg'
        const path = `customer-art/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from('order-uploads').upload(path, file, { contentType: file.type })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('order-uploads').getPublicUrl(path)
        uploadedImageUrl = data.publicUrl
      }
      const { error } = await supabase.from('orders').insert({
        customer_name: form.name, phone: form.phone, address: form.address, governorate: form.governorate,
        payment_method: form.payment_method, selected_frame_type: selectedFrame.name, selected_size: size,
        uploaded_image_url: uploadedImageUrl, order_status: 'New', total: price
      })
      if (error) throw error
      setStatus('success')
    } catch (error) { setStatus(error.message || 'error') }
  }

  const canContinue = (step === 1) || (step === 2) || (step === 3 && preview)
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-white" role="dialog" aria-modal="true">
    <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-5"><button onClick={() => step > 1 ? setStep(step - 1) : onClose()} className="touch -ml-3 flex items-center gap-1 px-3 text-sm"><ArrowLeft size={17} /> Back</button><span className="text-xs font-bold uppercase tracking-[.16em] text-gray-500">Create your piece</span><button aria-label="Close customizer" onClick={onClose} className="touch -mr-3 min-h-10 px-3"><X size={20} /></button></div>
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-6"><div className="mb-7 flex gap-1.5">{[1,2,3,4].map(number => <div key={number} className={`h-1 flex-1 rounded-full ${number <= step ? 'bg-sand' : 'bg-gray-100'}`} />)}</div>
      <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start"><section>{status === 'success' ? <OrderSuccess onClose={onClose} /> : <>
        {step === 1 && <StepSource source={source} preview={preview} inputRef={inputRef} setImage={setImage} selectArt={selectArt} categories={catalog.categories} />}
        {step === 2 && <StepFrame frame={frame} setFrame={setFrame} price={catalog.prices} />}
        {step === 3 && <StepSize size={size} setSize={setSize} />}
        {step === 4 && <Checkout form={form} setForm={setForm} onSubmit={submitOrder} status={status} />}
        {status !== 'success' && <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 p-4 backdrop-blur lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0"><button disabled={step === 4 || !canContinue} onClick={() => setStep(step + 1)} className="touch flex w-full items-center justify-center gap-2 bg-ink py-4 text-white disabled:cursor-not-allowed disabled:bg-gray-300">{step === 3 ? 'Continue to checkout' : 'Continue'} <ArrowRight size={18} /></button></div>}
      </>}</section>
        <LivePreview preview={preview} frame={frame} size={size} selectedFrame={selectedFrame} price={price} />
      </div>
    </div>
  </div>
}

function StepSource({ preview, inputRef, setImage, selectArt, categories }) { return <div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Step 1 of 4</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Choose your artwork</h2><p className="mt-2 text-sm leading-6 text-gray-600">Start with a personal image, or pick a mood from our collection.</p><input ref={inputRef} onChange={(e) => setImage(e.target.files?.[0])} type="file" accept="image/*" className="hidden" />
  <button onClick={() => inputRef.current?.click()} className="mt-6 flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-mist text-center transition hover:border-sand"><Upload className="mb-2 text-sand" /><span className="font-semibold">Upload my own photo</span><span className="mt-1 text-xs text-gray-500">JPG, PNG or HEIC from your phone</span></button>{preview && <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-700"><Check size={16} /> Artwork ready for preview</p>}
  <div className="mt-8"><p className="mb-3 text-sm font-semibold">Or browse a collection</p><div className="grid grid-cols-2 gap-3">{categories.map(item => <button key={item.name} onClick={() => selectArt(item.image)} className="group relative overflow-hidden rounded-xl"><img className="aspect-[1.35] w-full object-cover" src={item.image} alt="" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-3 pt-8 text-left text-sm font-semibold text-white">{item.name}</span></button>)}</div></div></div> }
function StepFrame({ frame, setFrame, price }) { return <div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Step 2 of 4</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Pick a finish</h2><p className="mt-2 text-sm leading-6 text-gray-600">Both made to bring colour, texture and personality to your space.</p><div className="mt-6 space-y-3">{frameOptions.map(option => <button key={option.id} onClick={() => setFrame(option.id)} className={`choice flex w-full items-center gap-4 p-4 ${frame === option.id ? 'border-sand bg-[#FCFAF7] ring-1 ring-sand' : ''}`}><div className={`h-16 w-12 shrink-0 rounded-sm ${option.id === 'classic' ? 'border-4 border-[#8B6B4A] bg-gray-100' : 'border border-gray-200 bg-gray-100'}`} /><span className="flex-1"><span className="block font-semibold">{option.name}</span><span className="mt-1 block text-xs font-normal text-gray-500">{option.sub}</span></span><span className="text-sm font-semibold">from {currency(price?.[option.id] ?? option.price)}</span></button>)}</div></div> }
function StepSize({ size, setSize }) { return <div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Step 3 of 4</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">How large is your wall?</h2><p className="mt-2 text-sm leading-6 text-gray-600">Choose a size that feels balanced in the room.</p><div className="mt-6 space-y-3">{sizes.map(option => <button key={option.id} onClick={() => setSize(option.id)} className={`choice flex w-full items-center gap-5 p-4 ${size === option.id ? 'border-sand bg-[#FCFAF7] ring-1 ring-sand' : ''}`}><div className="flex h-20 w-20 items-end justify-center rounded-lg bg-mist"><div className={`${option.scale} mb-2 border-2 border-gray-500 bg-white`} /></div><span><span className="block font-semibold">{option.label} <span className="font-normal text-gray-500">· {option.detail}</span></span><span className="mt-1 block text-xs font-normal text-gray-500">{option.hint}</span></span></button>)}</div></div> }
function Checkout({ form, setForm, onSubmit, status }) { const update = (event) => setForm({ ...form, [event.target.name]: event.target.value }); return <form onSubmit={onSubmit}><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Step 4 of 4</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Almost home</h2><p className="mt-2 text-sm leading-6 text-gray-600">No account needed. We’ll confirm your order by phone.</p><div className="mt-6 space-y-3"><input required name="name" value={form.name} onChange={update} className="field" placeholder="Your full name" /><input required name="phone" type="tel" inputMode="tel" value={form.phone} onChange={update} className="field" placeholder="Mobile phone (01XXXXXXXXX)" /><textarea required name="address" value={form.address} onChange={update} className="field min-h-24 py-3" placeholder="Delivery address, building and apartment" /><select required name="governorate" value={form.governorate} onChange={update} className="field text-gray-500"><option value="" disabled>Select governorate</option>{['Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Other'].map(x => <option key={x}>{x}</option>)}</select><select name="payment_method" value={form.payment_method} onChange={update} className="field"><option>Cash on Delivery</option><option>InstaPay Transfer</option><option>Vodafone Cash</option></select></div><button disabled={status === 'loading'} className="touch mt-6 flex w-full items-center justify-center gap-2 bg-ink py-4 text-white disabled:bg-gray-400">{status === 'loading' ? <><Loader2 className="animate-spin" size={18} /> Sending order…</> : 'Place order securely'}</button>{status && status !== 'loading' && <p className="mt-3 text-sm text-red-600">{status}. Please try again or contact us.</p>}</form> }
function LivePreview({ preview, frame, size, selectedFrame, price }) { const currentSize = sizes.find(x => x.id === size); return <aside className="sticky top-5 order-first rounded-2xl border border-gray-100 bg-mist p-5 shadow-sm lg:order-none"><div className="mb-4 flex items-center justify-between"><span className="text-sm font-semibold">Live preview</span><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{size}</span></div><div className="flex aspect-[1.15] items-center justify-center overflow-hidden rounded-xl bg-[#e8e4de] p-7"><div className={`relative bg-white shadow-gallery ${frame === 'classic' ? 'border-[10px] border-[#816247] p-1' : 'border border-gray-300'} ${size === 'A4' ? 'h-40 w-28' : size === 'A3' ? 'h-48 w-[8.5rem]' : 'h-52 w-[9.25rem]'}`}>{preview ? <img src={preview} alt="Selected artwork preview" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400"><ImageIcon size={25} /></div>}</div></div><div className="mt-4 border-t border-gray-200 pt-4"><p className="font-semibold">{selectedFrame.name}</p><p className="mt-1 text-sm text-gray-500">{currentSize.detail} · {selectedFrame.sub}</p><p className="mt-3 text-lg font-semibold">{currency(price)}</p></div></aside> }
function OrderSuccess({ onClose }) { return <div className="rounded-2xl bg-mist px-6 py-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={27} /></div><h2 className="mt-5 text-3xl font-semibold">Your order is in.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-600">Thank you! One of our art advisors will confirm your order and delivery shortly.</p><button onClick={onClose} className="touch mt-8 bg-ink text-white">Back to OASIS</button></div> }

function AdminLogin({ onClose, onSuccess }) { const [email, setEmail] = useState('codexa031@gmail.com'); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); async function login(e) { e.preventDefault(); setLoading(true); setError(''); const { error: signInError } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (signInError) setError('We couldn’t verify those details.'); else onSuccess() } return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-5"><form onSubmit={login} className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-gallery"><button type="button" onClick={onClose} className="absolute right-3 top-3 touch min-h-10 px-3"><X size={18} /></button><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-sand"><LockKeyhole size={19} /></div><h2 className="mt-4 text-xl font-semibold">Studio access</h2><p className="mt-1 text-sm text-gray-500">Sign in to manage your gallery.</p><input className="field mt-5" value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required /><input className="field mt-3" value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Password" required /><button disabled={loading} className="touch mt-4 flex w-full items-center justify-center gap-2 bg-ink text-white">{loading && <Loader2 size={16} className="animate-spin" />} Sign in</button>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</form></div> }

function AdminDashboard({ catalog, setCatalog, onExit, onSignOut }) { const [tab, setTab] = useState('orders'); const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [saveStatus, setSaveStatus] = useState(''); const loadOrders = async () => { setLoading(true); const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); if (!error) setOrders(data || []); setLoading(false) }; useEffect(() => { loadOrders() }, []); async function saveCatalog(e) { e.preventDefault(); setSaveStatus('Saving…'); const { error } = await supabase.from('store_settings').upsert({ key: 'catalog', value: catalog }, { onConflict: 'key' }); setSaveStatus(error ? error.message : 'Saved to your storefront.') } async function updateStatus(id, order_status) { const { error } = await supabase.from('orders').update({ order_status }).eq('id', id); if (!error) setOrders(orders.map(o => o.id === id ? { ...o, order_status } : o)) } return <div className="min-h-screen bg-mist"><header className="border-b border-gray-200 bg-white"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5"><div><p className="font-serif text-lg font-bold tracking-[.18em]">OASIS</p><p className="text-[10px] font-bold uppercase tracking-wider text-sand">Studio dashboard</p></div><div className="flex gap-1"><button onClick={onExit} className="touch min-h-10 px-3 text-sm">View shop</button><button onClick={onSignOut} aria-label="Sign out" className="touch min-h-10 px-3"><LogOut size={17} /></button></div></div></header><div className="mx-auto max-w-7xl px-5 py-7"><div className="mb-6 flex gap-2"><button onClick={() => setTab('orders')} className={`touch flex items-center gap-2 px-4 text-sm ${tab === 'orders' ? 'bg-ink text-white' : 'bg-white'}`}><Package size={16} /> Orders</button><button onClick={() => setTab('content')} className={`touch flex items-center gap-2 px-4 text-sm ${tab === 'content' ? 'bg-ink text-white' : 'bg-white'}`}><LayoutDashboard size={16} /> Content & pricing</button></div>{tab === 'orders' ? <Orders orders={orders} loading={loading} loadOrders={loadOrders} updateStatus={updateStatus} /> : <CatalogManager catalog={catalog} setCatalog={setCatalog} saveCatalog={saveCatalog} saveStatus={saveStatus} />}</div></div> }
function Orders({ orders, loading, loadOrders, updateStatus }) { return <section><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Order management</p><h1 className="mt-1 text-3xl font-semibold">Customer requests</h1></div><button onClick={loadOrders} className="touch min-h-10 bg-white px-4 text-sm">Refresh</button></div>{loading ? <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={17} /> Loading orders…</div> : orders.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">No orders yet. New customer requests will appear here.</div> : <div className="space-y-3">{orders.map(order => <article key={order.id} className="rounded-2xl bg-white p-4 shadow-sm sm:grid sm:grid-cols-[120px_1fr_auto] sm:gap-5"><img src={order.selected_product_image_url || order.uploaded_image_url || 'https://placehold.co/160x160?text=Art'} alt="Order artwork" className="mb-4 h-24 w-24 rounded-lg object-cover sm:mb-0" /><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{order.product_name || order.selected_frame_type}</h2><span className="rounded-full bg-mist px-2 py-1 text-[10px] font-bold uppercase text-gray-500">{order.selected_product_size || order.selected_size}</span></div><p className="mt-2 text-sm font-medium text-ink">Customer: {order.customer_name}</p><p className="mt-1 text-sm text-gray-600">{order.phone} · {order.governorate}</p><p className="mt-1 text-sm text-gray-500">{order.address}</p><p className="mt-2 text-sm font-medium">{order.payment_method} · {currency(order.total || 0)}</p></div><select value={order.order_status || 'New'} onChange={e => updateStatus(order.id, e.target.value)} className="field mt-4 min-h-10 py-0 text-sm sm:mt-0 sm:w-32"><option>New</option><option>Confirmed</option><option>In production</option><option>Delivered</option><option>Cancelled</option></select></article>)}</div>}</section> }
function CatalogManager({ catalog, setCatalog, saveCatalog, saveStatus }) {
  const [uploading, setUploading] = useState('')
  const slides = catalog.slides || DEFAULT_CATALOG.slides
  const bestSellers = catalog.bestSellers || DEFAULT_CATALOG.bestSellers
  const set = (field, value) => setCatalog({ ...catalog, [field]: value })
  const setPrice = (type, value) => setCatalog({ ...catalog, prices: { ...catalog.prices, [type]: Number(value) } })
  const setItem = (field, index, key, value) => { const items = [...(catalog[field] || DEFAULT_CATALOG[field])]; items[index] = { ...items[index], [key]: value }; set(field, items) }
  const addItem = (field) => {
    const items = [...(catalog[field] || DEFAULT_CATALOG[field])]
    if (field === 'slides') items.push({ title: 'New offer', subtitle: 'Add your offer description', image: 'https://placehold.co/1400x800?text=Upload+offer+image' })
    if (field === 'bestSellers' && items.length < 12) items.push({ name: 'New product', detail: 'Add product details', price: 0, oldPrice: null, image: 'https://placehold.co/800x1000?text=Upload+product+image', images: ['https://placehold.co/800x1000?text=Upload+product+image'], sizes: [{ label: 'A4 · 21 × 29.7 cm', price: 0 }] })
    set(field, items)
  }
  const removeItem = async (field, index, image) => {
    const label = field === 'slides' ? 'this offer' : 'this product'
    if (!window.confirm(`Delete ${label}? This cannot be undone after you save.`)) return
    const marker = '/storage/v1/object/public/store-assets/'
    const position = image?.indexOf(marker) ?? -1
    if (position >= 0) {
      const path = decodeURIComponent(image.slice(position + marker.length))
      const { error } = await supabase.storage.from('store-assets').remove([path])
      if (error) window.alert('The offer was removed from the website, but its unused image could not be deleted from Storage.')
    }
    const items = [...(catalog[field] || DEFAULT_CATALOG[field])]
    set(field, items.filter((_, itemIndex) => itemIndex !== index))
  }
  const upload = async (file, field, index) => {
    if (!file?.type?.startsWith('image/')) return
    setUploading(`${field}-${index}`)
    try {
      const extension = file.name.split('.').pop() || 'jpg'
      const path = `${field}/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from('store-assets').upload(path, file, { contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('store-assets').getPublicUrl(path)
      setItem(field, index, 'image', data.publicUrl)
    } catch (error) { window.alert(error.message || 'Image upload failed. Check your Supabase SQL setup.') }
    finally { setUploading('') }
  }
  const updateProduct = (index, update) => {
    const items = [...(catalog.bestSellers || DEFAULT_CATALOG.bestSellers)]
    items[index] = typeof update === 'function' ? update(items[index]) : { ...items[index], ...update }
    set('bestSellers', items)
  }
  const uploadProductImage = async (file, index) => {
    if (!file?.type?.startsWith('image/')) return
    setUploading(`product-image-${index}`)
    try {
      const extension = file.name.split('.').pop() || 'jpg'
      const path = `products/${crypto.randomUUID()}.${extension}`
      const { error } = await supabase.storage.from('store-assets').upload(path, file, { contentType: file.type })
      if (error) throw error
      const { data } = supabase.storage.from('store-assets').getPublicUrl(path)
      updateProduct(index, item => { const images = [...productGallery(item), data.publicUrl]; return { ...item, image: images[0], images } })
    } catch (error) { window.alert(error.message || 'Image upload failed. Check your Supabase SQL setup.') }
    finally { setUploading('') }
  }
  const removeProductImage = (index, imageIndex) => updateProduct(index, item => { const images = productGallery(item).filter((_, current) => current !== imageIndex); return { ...item, image: images[0] || '', images } })
  const updateProductSize = (index, sizeIndex, key, value) => updateProduct(index, item => { const sizes = productSizes(item); sizes[sizeIndex] = { ...sizes[sizeIndex], [key]: key === 'price' ? Number(value) : value }; return { ...item, price: sizes[0]?.price ?? item.price, sizes } })
  const addProductSize = (index) => updateProduct(index, item => ({ ...item, sizes: [...productSizes(item), { label: 'New size', price: item.price }] }))
  const removeProductSize = (index, sizeIndex) => updateProduct(index, item => { const sizes = productSizes(item).filter((_, current) => current !== sizeIndex); return { ...item, sizes, price: sizes[0]?.price ?? item.price } })
  return <form onSubmit={saveCatalog} className="max-w-4xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-sand">Storefront controls</p><h1 className="mt-1 text-3xl font-semibold">Your offers, products & prices</h1><p className="mt-2 text-sm text-gray-600">Upload the four home offers and manage every visible product price here. Press Save when you finish.</p>
    <div className="mt-6 space-y-5 rounded-2xl bg-white p-5 shadow-sm"><label className="block text-sm font-semibold">Top promotion strip<input value={catalog.promotion} onChange={e => set('promotion', e.target.value)} className="field mt-2" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Custom wood frame price<input type="number" value={catalog.prices.classic} onChange={e => setPrice('classic', e.target.value)} className="field mt-2" /></label><label className="text-sm font-semibold">Custom Forex price<input type="number" value={catalog.prices.forex} onChange={e => setPrice('forex', e.target.value)} className="field mt-2" /></label></div></div>
    <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">Home offer slideshow</h2><p className="mt-1 text-xs text-gray-500">Add as many offers as you need. Customers can swipe them, and the show changes every 4 seconds.</p></div><button type="button" onClick={() => addItem('slides')} className="touch min-h-10 shrink-0 bg-mist px-3 text-sm"><Plus size={16} className="inline" /> Add offer</button></div><div className="mt-5 space-y-5">{slides.map((slide, i) => <div key={i} className="grid gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-[120px_1fr]"><img src={slide.image} alt="" className="h-28 w-full rounded-lg object-cover sm:w-[7.5rem]" /><div className="grid gap-2"><div className="flex gap-2"><input value={slide.title} onChange={e => setItem('slides', i, 'title', e.target.value)} className="field" placeholder="Offer title" /><button type="button" onClick={() => removeItem('slides', i, slide.image)} className="touch min-h-12 shrink-0 border border-red-200 px-3 text-red-600" aria-label="Delete offer"><Trash2 size={17} /></button></div><input value={slide.subtitle} onChange={e => setItem('slides', i, 'subtitle', e.target.value)} className="field" placeholder="Short offer description" /><div className="flex gap-2"><input value={slide.image} onChange={e => setItem('slides', i, 'image', e.target.value)} className="field min-w-0" placeholder="Image URL" /><label className="touch shrink-0 cursor-pointer bg-mist py-3 text-sm">{uploading === `slides-${i}` ? 'Uploading…' : 'Upload'}<input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files?.[0], 'slides', i)} /></label></div></div></div>)}{slides.length === 0 && <p className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500">No live offers. Tap “Add offer” to create one.</p>}</div></div>
    <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">Products & ordering options</h2><p className="mt-1 text-xs text-gray-500">Add product photos and size buttons. Customers choose both before ordering.</p></div><button type="button" disabled={bestSellers.length >= 12} onClick={() => addItem('bestSellers')} className="touch min-h-10 shrink-0 bg-mist px-3 text-sm disabled:opacity-40"><Plus size={16} className="inline" /> Add product</button></div><div className="mt-5 grid gap-5 sm:grid-cols-2">{bestSellers.map((item, i) => <div key={i} className="rounded-xl border border-gray-100 p-3"><div className="relative"><img src={productGallery(item)[0]} alt="" className="h-36 w-full rounded-lg object-cover" /><button type="button" onClick={() => removeItem('bestSellers', i, item.image)} className="absolute right-2 top-2 touch min-h-10 border border-red-200 bg-white/95 px-3 text-red-600" aria-label="Delete product"><Trash2 size={17} /></button></div><div className="mt-3 grid gap-2"><input value={item.name} onChange={e => setItem('bestSellers', i, 'name', e.target.value)} className="field" placeholder="Product name" /><textarea value={item.detail} onChange={e => setItem('bestSellers', i, 'detail', e.target.value)} className="field min-h-20 py-3" placeholder="Full product description" /><div className="grid grid-cols-2 gap-2"><input type="number" value={item.price} onChange={e => setItem('bestSellers', i, 'price', Number(e.target.value))} className="field" placeholder="Starting price" /><input type="number" value={item.oldPrice || ''} onChange={e => setItem('bestSellers', i, 'oldPrice', e.target.value ? Number(e.target.value) : null)} className="field" placeholder="Old price" /></div><div className="mt-2 border-t border-gray-100 pt-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Product photos</p><label className="touch min-h-10 cursor-pointer bg-mist px-3 text-xs">{uploading === `product-image-${i}` ? 'Uploading…' : '+ Add photo'}<input type="file" accept="image/*" className="hidden" onChange={e => uploadProductImage(e.target.files?.[0], i)} /></label></div><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{productGallery(item).map((image, imageIndex) => <div key={`${image}-${imageIndex}`} className="relative h-16 w-14 shrink-0"><img src={image} alt="" className="h-full w-full rounded-lg object-cover" />{productGallery(item).length > 1 && <button type="button" onClick={() => removeProductImage(i, imageIndex)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white" aria-label="Remove photo"><X size={12} /></button>}</div>)}</div></div><div className="mt-2 border-t border-gray-100 pt-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Size buttons shown to customer</p><button type="button" onClick={() => addProductSize(i)} className="touch min-h-10 bg-mist px-3 text-xs"><Plus size={14} className="inline" /> Add size</button></div><div className="mt-2 space-y-2">{productSizes(item).map((size, sizeIndex) => <div key={sizeIndex} className="flex gap-2"><input value={size.label} onChange={e => updateProductSize(i, sizeIndex, 'label', e.target.value)} className="field" placeholder="e.g. 50 × 70 cm" /><input type="number" value={size.price ?? item.price} onChange={e => updateProductSize(i, sizeIndex, 'price', e.target.value)} className="field w-28" placeholder="Price" />{productSizes(item).length > 1 && <button type="button" onClick={() => removeProductSize(i, sizeIndex)} className="touch min-h-12 shrink-0 border border-red-200 px-3 text-red-600" aria-label="Delete size"><Trash2 size={16} /></button>}</div>)}</div></div></div></div>)}</div></div>
    <button className="touch mt-5 bg-ink text-white">Save all storefront changes</button>{saveStatus && <p className="mt-3 text-sm text-gray-600">{saveStatus}</p>}</form>
}
