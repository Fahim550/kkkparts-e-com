import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct, type DbProduct } from '@/hooks/useDatabase';
import { useSaveVariations, useProductVariations } from '@/hooks/useProductVariations';
import { useActiveCategories } from '@/hooks/useCategories';
import { uploadProductImage, deleteProductImage } from '@/lib/image-upload';
import { Plus, Pencil, Trash2, X, Search, Upload, ImageIcon, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import DirhamIcon from '@/components/DirhamIcon';

interface VariationRow {
  size: string;
  color: string;
  sku: string;
  price: string;
  stock: number;
}

const emptyForm = {
  name: '', brand: '', price: 0, original_price: null as number | null, dealer_price: null as number | null, dealer_original_price: null as number | null, category: 'running',
  image: '', images: [] as string[], sku: '',
  sizes: '', colors: '', description: '', stock: 50, location: '',
  is_active: true, is_trending: false, is_new: false, is_offer: false,
};

const ProductsManager = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products = [], isLoading } = useProducts();
  const { data: categoryList = [] } = useActiveCategories();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const saveVariations = useSaveVariations();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [variations, setVariations] = useState<VariationRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const mainImageRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [autoOpened, setAutoOpened] = useState(false);
  const [dealerDiscountPct, setDealerDiscountPct] = useState<string>('');

  // Auto-open product from URL params
  useEffect(() => {
    if (products.length === 0 || autoOpened) return;

    const viewId = searchParams.get('view');
    const productName = searchParams.get('name');
    const productPrice = searchParams.get('price');
    const productColor = searchParams.get('color');
    const productSize = searchParams.get('size');

    const matchedProduct = viewId
      ? products.find(p => p.id === viewId)
      : products.find(p => {
          const matchesName = productName
            ? p.name.trim().toLowerCase() === productName.trim().toLowerCase()
            : true;
          const matchesPrice = productPrice
            ? Number(p.price) === Number(productPrice)
            : true;
          const matchesColor = productColor
            ? (p.colors || []).some(color => color.trim().toLowerCase() === productColor.trim().toLowerCase())
            : true;
          const matchesSize = productSize
            ? (p.sizes || []).some(size => String(size) === String(productSize))
            : true;

          return matchesName && matchesPrice && matchesColor && matchesSize;
        });

    if (matchedProduct) {
      openEdit(matchedProduct);
      setAutoOpened(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, products, autoOpened, setSearchParams]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && (p.sku as string).toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setVariations([]);
    setDealerDiscountPct('');
    setShowForm(true);
  };

  const openEdit = (p: DbProduct) => {
    setEditing(p);
    setForm({
      name: p.name, brand: p.brand, price: Number(p.price),
      original_price: p.original_price ? Number(p.original_price) : null,
      dealer_price: p.dealer_price ? Number(p.dealer_price) : null,
      dealer_original_price: p.dealer_original_price ? Number(p.dealer_original_price) : null,
      category: p.category, image: p.image, images: p.images || [],
      sku: (p as any).sku || '',
      sizes: (p.sizes || []).join(', '), colors: (p.colors || []).join(', '),
      description: p.description || '', stock: p.stock || 50, location: p.location || '',
      is_active: p.is_active ?? true, is_trending: p.is_trending ?? false, is_new: p.is_new ?? false, is_offer: (p as any).is_offer ?? false,
    });
    setDealerDiscountPct(p.dealer_price && p.price ? String(Math.round((1 - Number(p.dealer_price) / Number(p.price)) * 100)) : '');
    setShowForm(true);
  };

  // Load variations when editing
  const { data: existingVariations } = useProductVariations(editing?.id || '');
  useEffect(() => {
    if (editing && existingVariations) {
      setVariations(existingVariations.map(v => ({
        size: v.size, color: v.color, sku: v.sku || '',
        price: v.price !== null ? String(v.price) : '', stock: v.stock,
      })));
    }
  }, [existingVariations, editing?.id]);

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, 'main');
      setForm(f => ({ ...f, image: url }));
      toast.success('Main image uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setGalleryUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file, 'gallery');
        urls.push(url);
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
      toast.success(`${urls.length} image(s) added to gallery`);
    } catch { toast.error('Gallery upload failed'); }
    finally { setGalleryUploading(false); }
  };

  const removeGalleryImage = async (url: string) => {
    setForm(f => ({ ...f, images: f.images.filter(i => i !== url) }));
    try { await deleteProductImage(url); } catch { /* ignore */ }
  };

  const removeMainImage = async () => {
    if (form.image) {
      try { await deleteProductImage(form.image); } catch { /* ignore */ }
    }
    setForm(f => ({ ...f, image: '' }));
  };

  const generateVariations = () => {
    const sizes = form.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const colors = form.colors.split(',').map(c => c.trim()).filter(Boolean);
    if (!sizes.length || !colors.length) {
      toast.error('Add sizes and colors first');
      return;
    }
    const newVars: VariationRow[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        const existing = variations.find(v => v.size === size && v.color === color);
        newVars.push(existing || { size, color, sku: '', price: '', stock: 0 });
      }
    }
    setVariations(newVars);
  };

  const updateVariation = (idx: number, field: keyof VariationRow, value: string | number) => {
    setVariations(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const removeVariation = (idx: number) => {
    setVariations(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.brand) {
      toast.error('Name and Brand are required');
      return;
    }
    // Derive sizes/colors from form inputs, or fall back to variations if inputs empty
    const sizesFromInput = form.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const colorsFromInput = form.colors.split(',').map(c => c.trim()).filter(Boolean);
    // Merge input values with variation rows so manual variation sizes/colors aren't lost
    const sizesFromVariations = Array.from(new Set(variations.map(v => String(v.size)).filter(Boolean)));
    const colorsFromVariations = Array.from(new Set(variations.map(v => String(v.color)).filter(Boolean)));
    const sizesFinal = Array.from(new Set([...sizesFromInput, ...sizesFromVariations]));
    const colorsFinal = Array.from(new Set([...colorsFromInput, ...colorsFromVariations]));

    const data: any = {
      name: form.name, brand: form.brand, price: form.price,
      original_price: form.original_price, dealer_price: form.dealer_price, dealer_original_price: form.dealer_original_price, category: form.category,
      image: form.image || '/assets/shoe-runner-1.jpg',
      images: form.images.length > 0 ? form.images : [form.image || '/assets/shoe-runner-1.jpg'],
      sku: form.sku,
      location: form.location,
      sizes: sizesFinal,
      colors: colorsFinal,
      description: form.description, stock: form.stock,
      is_active: form.is_active, is_trending: form.is_trending, is_new: form.is_new, is_offer: form.is_offer,
    };

    try {
      let productId: string;
      if (editing) {
        await updateProduct.mutateAsync({ id: editing.id, ...data });
        productId = editing.id;
        toast.success('Product updated');
      } else {
        const result = await addProduct.mutateAsync(data);
        productId = result.id;
        toast.success('Product added');
      }
      // Save variations
      if (variations.length > 0) {
        await saveVariations.mutateAsync({
          productId,
          variations: variations.map(v => ({
            size: v.size, color: v.color, sku: v.sku,
            price: v.price ? parseFloat(v.price) : null,
            stock: v.stock,
          })),
        });
      }
      setShowForm(false);
    } catch { toast.error('Failed to save product'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">Products</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{products.length} total products</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search by name, brand, or SKU..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-border bg-card rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
      </div>

      {isLoading ? (
        <p className="text-center py-10 text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">Product</th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">Price</th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">Stock</th>
                <th className="text-left p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-right p-4 font-heading text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded bg-secondary" />
                      <div>
                        <p className="font-body text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="font-body text-xs text-muted-foreground">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-body text-sm text-muted-foreground hidden md:table-cell">{(p as any).sku || '—'}</td>
                  <td className="p-4">
                    <p className="font-body text-sm font-bold text-primary flex items-center gap-1"><DirhamIcon /> {Number(p.price)}</p>
                    {p.original_price && <p className="font-body text-xs text-muted-foreground line-through flex items-center gap-1"><DirhamIcon /> {Number(p.original_price)}</p>}
                  </td>
                  <td className="p-4 font-body text-sm capitalize text-foreground hidden md:table-cell">{p.category}</td>
                  <td className="p-4 font-body text-sm text-foreground">{p.stock}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-body font-bold rounded-full uppercase ${p.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-secondary rounded-md transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-destructive/10 rounded-md transition-colors"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-3xl my-8 p-6 md:p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">{editing ? 'Edit' : 'Add'} Product</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Product Name *</label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Air Max 90" />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Brand *</label>
                    <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required placeholder="e.g. Nike" />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">SKU</label>
                    <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. NKE-AM90-BLK" />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full h-10 px-3 border border-input bg-background rounded-md font-body text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {categoryList.length > 0
                        ? categoryList.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)
                        : ['running','basketball','football','training','lifestyle','trail','women'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Location</label>
                    <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Muscat, Salalah..." />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Product description..."
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">Pricing & Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 border border-border/50 bg-background/50 p-4 rounded-md">
                    <h4 className="font-heading text-xs uppercase tracking-wider font-bold text-foreground mb-2 pb-2 border-b border-border/50">Single Customer</h4>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">Selling Price (<DirhamIcon className="w-3 h-3" />) *</label>
                      <Input type="number" step="0.01" value={form.price || ''} onChange={e => {
                        const newPrice = +e.target.value;
                        const newForm = { ...form, price: newPrice };
                        if (dealerDiscountPct && newPrice) {
                          const pct = Number(dealerDiscountPct);
                          newForm.dealer_price = Number((newPrice - (newPrice * pct / 100)).toFixed(2));
                        }
                        setForm(newForm);
                      }} required />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">Old Price / Strikethrough (<DirhamIcon className="w-3 h-3" />)</label>
                      <Input type="number" step="0.01" value={form.original_price || ''} onChange={e => setForm({ ...form, original_price: e.target.value ? +e.target.value : null })} placeholder="e.g. 15 (will show as crossed out)" />
                      <p className="font-body text-xs text-muted-foreground mt-1">Set this higher than selling price to show a sale</p>
                    </div>
                  </div>

                  <div className="space-y-4 border border-border/50 bg-background/50 p-4 rounded-md">
                    <h4 className="font-heading text-xs uppercase tracking-wider font-bold text-foreground mb-2 pb-2 border-b border-border/50">Dealer</h4>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">Dealer Selling Price (<DirhamIcon className="w-3 h-3" />)</label>
                      <Input type="number" step="0.01" value={form.dealer_price || ''} onChange={e => {
                        const dp = e.target.value ? +e.target.value : null;
                        setForm({ ...form, dealer_price: dp });
                        if (dp && form.price) {
                          setDealerDiscountPct(String(Math.round((1 - dp / form.price) * 100)));
                        } else {
                          setDealerDiscountPct('');
                        }
                      }} placeholder="For dealers" />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Dealer Discount (%)</label>
                      <Input type="number" step="0.1" value={dealerDiscountPct} onChange={e => {
                        setDealerDiscountPct(e.target.value);
                        if (e.target.value && form.price) {
                          const pct = Number(e.target.value);
                          const newDealerPrice = form.price - (form.price * pct / 100);
                          setForm({ ...form, dealer_price: Number(newDealerPrice.toFixed(2)) });
                        } else if (!e.target.value) {
                          setForm({ ...form, dealer_price: null });
                        }
                      }} placeholder="Auto-calculates Dealer Price" />
                    </div>
                    <div>
                      <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">Dealer Old Price / Strikethrough (<DirhamIcon className="w-3 h-3" />)</label>
                      <Input type="number" step="0.01" value={form.dealer_original_price || ''} onChange={e => setForm({ ...form, dealer_original_price: e.target.value ? +e.target.value : null })} placeholder="Old price for dealers" />
                      <p className="font-body text-xs text-muted-foreground mt-1">If empty, falls back to Single Customer Old Price</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border border-border/50 bg-background/50 p-4 rounded-md">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Stock Quantity</label>
                    <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} className="max-w-[200px]" />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">Images</h3>
                
                {/* Main Image */}
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Main Product Image</label>
                  <div className="flex items-start gap-4">
                    {form.image ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border bg-secondary">
                        <img src={form.image} alt="Main" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeMainImage}
                          className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/50">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <input ref={mainImageRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                      <button type="button" onClick={() => mainImageRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-md font-body text-sm hover:bg-secondary transition-colors disabled:opacity-50">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <p className="font-body text-xs text-muted-foreground mt-2">Or paste URL:</p>
                      <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." className="mt-1 text-xs" />
                    </div>
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">Gallery Images</label>
                  <div className="flex flex-wrap gap-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-secondary">
                        <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeGalleryImage(img)}
                          className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div>
                      <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                      <button type="button" onClick={() => galleryRef.current?.click()} disabled={galleryUploading}
                        className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors disabled:opacity-50">
                        {galleryUploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Plus className="w-5 h-5 text-muted-foreground" />}
                        <span className="font-body text-xs text-muted-foreground">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sizes & Colors */}
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">Sizes & Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Sizes (comma separated)</label>
                    <Input value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} placeholder="39, 40, 41, 42, 43" />
                  </div>
                  <div>
                    <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">Colors (comma separated)</label>
                    <Input value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} placeholder="Black, White, Brown" />
                  </div>
                </div>
              </div>

              {/* Variations */}
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">Variations</h3>
                  <button type="button" onClick={generateVariations}
                    className="font-body text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
                    Generate from Sizes & Colors
                  </button>
                </div>
                {variations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-body text-xs uppercase tracking-wider text-muted-foreground">Size</th>
                          <th className="text-left py-2 px-2 font-body text-xs uppercase tracking-wider text-muted-foreground">Color</th>
                          <th className="text-left py-2 px-2 font-body text-xs uppercase tracking-wider text-muted-foreground">SKU</th>
                          <th className="text-left py-2 px-2 font-body text-xs uppercase tracking-wider text-muted-foreground">Price</th>
                          <th className="text-left py-2 px-2 font-body text-xs uppercase tracking-wider text-muted-foreground">Stock</th>
                          <th className="py-2 px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variations.map((v, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2 px-2">
                              <Input value={v.size} onChange={e => updateVariation(i, 'size', e.target.value)} className="h-8 text-xs" />
                            </td>
                            <td className="py-2 px-2">
                              <Input value={v.color} onChange={e => updateVariation(i, 'color', e.target.value)} className="h-8 text-xs" />
                            </td>
                            <td className="py-2 px-2">
                              <Input value={v.sku} onChange={e => updateVariation(i, 'sku', e.target.value)} className="h-8 text-xs" placeholder="Optional" />
                            </td>
                            <td className="py-2 px-2">
                              <Input type="number" step="0.01" value={v.price} onChange={e => updateVariation(i, 'price', e.target.value)} className="h-8 text-xs w-20" placeholder="Base" />
                            </td>
                            <td className="py-2 px-2">
                              <Input type="number" value={v.stock} onChange={e => updateVariation(i, 'stock', +e.target.value)} className="h-8 text-xs w-16" />
                            </td>
                            <td className="py-2 px-2">
                              <button type="button" onClick={() => removeVariation(i)} className="text-destructive hover:text-destructive/80">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="font-body text-xs text-muted-foreground">No variations. Click "Generate" after adding sizes and colors, or add them manually.</p>
                )}
                <button type="button" onClick={() => setVariations([...variations, { size: '', color: '', sku: '', price: '', stock: 0 }])}
                  className="flex items-center gap-1 font-body text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>

              {/* Status Toggles */}
              <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-3">
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</h3>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 font-body text-sm text-foreground">
                    <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
                    Active
                  </label>
                  <label className="flex items-center gap-2 font-body text-sm text-foreground">
                    <Switch checked={form.is_trending} onCheckedChange={v => setForm({ ...form, is_trending: v })} />
                    Trending
                  </label>
                  <label className="flex items-center gap-2 font-body text-sm text-foreground">
                    <Switch checked={form.is_new} onCheckedChange={v => setForm({ ...form, is_new: v })} />
                    New Arrival
                  </label>
                  <label className="flex items-center gap-2 font-body text-sm text-foreground">
                    <Switch checked={form.is_offer} onCheckedChange={v => setForm({ ...form, is_offer: v })} />
                    Offer Product
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={addProduct.isPending || updateProduct.isPending || saveVariations.isPending}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50">
                  {addProduct.isPending || updateProduct.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-8 py-3 border border-border rounded-md font-body text-sm font-medium hover:bg-secondary transition-colors text-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
