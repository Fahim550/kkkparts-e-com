import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCustomerOrders, useProducts, useDealerDeleteOrder } from '@/hooks/useDatabase';
import { uploadProductImage } from '@/lib/image-upload';
import { Package, Phone, Mail, ShieldCheck, Clock, CheckCircle2, XCircle, MapPin, Trash2, Lock, Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DirhamIcon from '@/components/DirhamIcon';

const DealerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: dealerOrders = [], isLoading: ordersLoading } = useCustomerOrders(user?.email);
  const deleteDealerOrder = useDealerDeleteOrder();
  const { data: products = [] } = useProducts();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/dealer/login');
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase.from('dealers').select('*').eq('id', user.id).maybeSingle();
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);



  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${orderNumber} from your history?`)) return;
    try {
      await deleteDealerOrder.mutateAsync(id);
      toast.success('Order removed from your history');
    } catch {
      toast.error('Failed to remove order');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file, 'dealers');
      const { error } = await supabase.from('dealers').update({ profile_image: url }).eq('id', user.id);
      
      if (error) throw error;
      
      setProfile(prev => ({ ...prev, profile_image: url }));
      toast.success('Profile image updated');
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload profile image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col notranslate">
        <Navbar />
        <div className="flex-grow flex items-center justify-center mt-[74px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col notranslate">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-4 py-6 md:py-8 mt-28 md:mt-36">
        <div className="container mx-auto lg:px-4 px-1 space-y-6">
          {!profile?.is_approved && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 font-body">
                    <strong>Your account is pending approval.</strong> Until an admin approves your account, you will see regular customer prices and can order without the minimum wholesale quantity. Once approved, you will unlock exclusive dealer pricing!
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-extrabold uppercase tracking-widest text-gray-900">Dealer Dashboard</h1>
              <p className="font-body text-gray-500 mt-1">Manage your wholesale account and track orders</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link to="/parts" className="bg-primary text-white px-6 py-3 md:py-2.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors shadow-sm w-full text-center block">
                Shop Wholesale Parts
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Profile Card */}
            <div className="md:col-span-1 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 h-fit md:sticky md:top-24">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div 
                  className="relative cursor-pointer"
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-colors">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : profile?.profile_image ? (
                      <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <ShieldCheck className="w-8 h-8" />
                    )}
                  </div>
                  {!uploadingImage && (
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full border-2 border-white shadow-sm hover:scale-105 transition-transform">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">{profile?.full_name || user?.user_metadata?.full_name || 'Dealer'}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    {profile?.is_approved ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Approved Dealer</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending Approval</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                    <p className="text-sm text-gray-900">{user?.email}</p>
                  </div>
                </div>
                {profile?.plain_password && (
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Password</p>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100 inline-block">{profile.plain_password}</p>
                    </div>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Phone</p>
                      <p className="text-sm text-gray-900">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile?.license_number && (
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">License Number</p>
                      <p className="text-sm text-gray-900">{profile.license_number}</p>
                    </div>
                  </div>
                )}
                {profile?.area && (
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Area</p>
                      <p className="text-sm text-gray-900">{profile.area}</p>
                    </div>
                  </div>
                )}
                {profile?.sponsored_details && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Address</p>
                      <p className="text-sm text-gray-900">{profile.sponsored_details}</p>
                    </div>
                  </div>
                )}
                
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full py-2.5 text-red-600 font-bold uppercase tracking-wider text-sm hover:bg-red-50 rounded-xl transition-colors">
                  Sign Out
                </button>
              </div>
            </div>

            {/* Orders Section */}
            <div className="md:col-span-2 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 mt-6 md:mt-0">
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-bold uppercase tracking-wider text-gray-900">Your Orders</h2>
              </div>

              {ordersLoading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : dealerOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-bold text-gray-900 mb-1">No Orders Yet</h3>
                  <p className="text-sm text-gray-500 mb-4">You haven't placed any wholesale orders.</p>
                  <Link to="/parts" className="text-primary font-bold hover:underline">Start Shopping →</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {dealerOrders.map(order => (
                    <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-50">
                        <div>
                          <p className="font-bold text-gray-900">{order.order_number}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2 sm:mt-0">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status}
                          </span>
                          <span className="font-bold text-primary flex items-center gap-1">
                            <DirhamIcon /> {Number(order.total).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.order_number)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors sm:ml-2"
                            title="Delete from history"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        {((order.items as any[]) || []).map((item, i) => {
                          const product = products.find(p => p.id === item.productId);
                          const image = item.image || product?.image;
                          
                          return (
                            <div key={i} className="flex items-center gap-3 md:gap-4 text-sm text-gray-600 bg-gray-50 p-2.5 md:p-2 rounded-lg">
                              <div className="w-12 h-12 bg-white rounded-md border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                {image ? (
                                  <img src={image} alt={item.productName} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <p className="font-bold text-gray-900">{item.productName}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DealerDashboard;
