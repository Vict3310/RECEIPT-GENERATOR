import React, { useState, useEffect, useRef, useMemo } from 'react';
import logo from './assets/logo.png';
import { supabase } from './lib/supabase';
import gsap from 'gsap';
import QRCode from 'qrcode';
import {
  Plus,
  Trash2,
  Download,
  Send,
  Printer,
  FileText,
  RefreshCw,
  User,
  Phone,
  DollarSign,
  Clock,
  Database,
  ExternalLink,
  Copy,
  Check,
  Search,
  Sliders,
  AlertCircle,
  TrendingUp,
  Users,
  Percent,
  Layers,
  Palette,
  ShieldCheck,
  Settings,
  Briefcase
} from 'lucide-react';

// Fallback seed database customized for Chuks Technology (Phone & Repairs)
// Updated with default cost values and status
const initialDirectory = [
  {
    name: "Amina Al-Jamil",
    phone: "+2348031122334",
    lastTransactionAmount: 64.50,
    totalTransactions: 2,
    lastTransactionDate: "2026-05-22 14:32:01"
  },
  {
    name: "Eren Yeager",
    phone: "+2347065551212",
    lastTransactionAmount: 537.50,
    totalTransactions: 1,
    lastTransactionDate: "2026-05-21 09:12:45"
  },
  {
    name: "Marcus Vance",
    phone: "+2348123456789",
    lastTransactionAmount: 37.60,
    totalTransactions: 3,
    lastTransactionDate: "2026-05-22 19:05:12"
  }
];

const initialLedger = [
  {
    id: "RG-8902-26",
    customerName: "Amina Al-Jamil",
    phoneNumber: "+2348031122334",
    timestamp: "2026-05-22 14:32:01",
    status: "READY_FOR_PICKUP",
    items: [
      { name: "iPhone 11 Screen Fix (Original LCD)", price: 45.00, cost: 25.00, quantity: 1 },
      { name: "Oraimo 20W Fast Charger Head", price: 15.00, cost: 8.50, quantity: 1 }
    ],
    subtotal: 60.00,
    tax: 4.50,
    total: 64.50,
    notes: "Repaired screen. 14 days warranty active."
  },
  {
    id: "RG-7341-26",
    customerName: "Eren Yeager",
    phoneNumber: "+2347065551212",
    timestamp: "2026-05-21 09:12:45",
    status: "COMPLETED",
    items: [
      { name: "UK Used iPhone 13 Pro Max (128GB, Sierra Blue)", price: 500.00, cost: 420.00, quantity: 1 }
    ],
    subtotal: 500.00,
    tax: 37.50,
    total: 537.50,
    notes: "Clean UK used. Battery health 92%. Charger pack added."
  },
  {
    id: "RG-4491-26",
    customerName: "Marcus Vance",
    phoneNumber: "+2348123456789",
    timestamp: "2026-05-22 19:05:12",
    status: "SALES",
    items: [
      { name: "Oraimo FreePods 4 ANC Bluetooth", price: 35.00, cost: 20.00, quantity: 1 }
    ],
    subtotal: 35.00,
    tax: 2.63,
    total: 37.63,
    notes: "Store sale."
  }
];

// Status-specific outreach message templates (outside component to avoid re-creation on every render)
const STATUS_OUTREACH_MESSAGES = {
  SALES: "Hello {name}, thank you for your patronage at Chuks Technology! Your total for {id} was {total} on {date}. Warranty: goods bought in good condition are not returnable after 1 week. Please contact us for support!",
  DIAGNOSING: "Hello {name}, your device is undergoing professional diagnostics at Chuks Technology. ID: {id}. We will update you with parts pricing shortly.",
  REPAIRING: "Hello {name}, your device is currently on our laboratory workbench under active repairs. ID: {id}. Thank you for your patience.",
  READY_FOR_PICKUP: "Hello {name}, your device is READY FOR PICKUP at Chuks Technology! Please visit our store at Otigba Street to test and collect. ID: {id}. Balance due: {total}.",
  COMPLETED: "Hello {name}, thank you for picking up your device today. We hope you are satisfied with our repairs & sales solutions! Chuks Technology."
};

// Presets data customized for a phone sales & repair center
const presetTemplates = {
  phoneSale: [
    { name: "UK Used iPhone 13 Pro Max (128GB, 91% BH)", price: "480.00", cost: "390.00", quantity: 1 },
    { name: "Original Apple 20W USB-C Adapter", price: "25.00", cost: "10.00", quantity: 1 }
  ],
  oledRepair: [
    { name: "Samsung S22 Ultra Screen Replacement (Original Super AMOLED)", price: "190.00", cost: "115.00", quantity: 1 },
    { name: "Original Screen Glue & Board Service Fee", price: "15.00", cost: "2.00", quantity: 1 },
    { name: "9D Curved Tempered Glass Screen Guard", price: "8.00", cost: "1.50", quantity: 1 }
  ],
  accessories: [
    { name: "Oraimo FreePods 4 ANC Bluetooth Earbuds", price: "45.00", cost: "24.00", quantity: 1 },
    { name: "Anker PowerCore 20k mAh Fast-Charge Powerbank", price: "35.00", cost: "18.00", quantity: 1 },
    { name: "Oraimo 3-in-1 Nylon Fast Charging Cable", price: "12.00", cost: "4.00", quantity: 2 }
  ]
};

function App() {
  // Theme & Currency configuration
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("receiptgen_theme") || "charcoal";
  });
  const [currencySymbol, setCurrencySymbol] = useState(() => {
    return localStorage.getItem("receiptgen_currency") || "$";
  });

  // Receipt ticket elements toggles configuration
  const [showQRCode, setShowQRCode] = useState(() => {
    const saved = localStorage.getItem("receiptgen_showQRCode");
    return saved === null ? true : saved === "true";
  });
  const [showBarcode, setShowBarcode] = useState(() => {
    const saved = localStorage.getItem("receiptgen_showBarcode");
    return saved === null ? true : saved === "true";
  });
  const [showWarranty, setShowWarranty] = useState(() => {
    const saved = localStorage.getItem("receiptgen_showWarranty");
    return saved === null ? true : saved === "true";
  });
  const [showGreetings, setShowGreetings] = useState(() => {
    const saved = localStorage.getItem("receiptgen_showGreetings");
    return saved === null ? true : saved === "true";
  });

  // System Clock State
  const [systemTime, setSystemTime] = useState("");

  // Supabase-backed state — starts empty, loaded on mount
  const [ledger, setLedger] = useState([]);
  const [directory, setDirectory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  // Configurable VAT Rate state (defaults to 7.5% standard Nigerian VAT)
  const [vatRate, setVatRate] = useState(() => {
    const saved = localStorage.getItem("receiptgen_vatRate");
    return saved ? parseFloat(saved) : 7.5;
  });

  // Form Inputs State
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [items, setItems] = useState([{ name: "", price: "", cost: "", quantity: 1 }]);
  const [notes, setNotes] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("SALES");

  // Search Queries
  const [directorySearch, setDirectorySearch] = useState("");
  const [ledgerSearch, setLedgerSearch] = useState("");


  // Preview & Modal State
  const [activeReceipt, setActiveReceipt] = useState(ledger[0] || null);
  const [jsonModalData, setJsonModalData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Refs
  const qrCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const analyticsRef = useRef(null);
  const generatorRef = useRef(null);
  const previewRef = useRef(null);
  const directoryRef = useRef(null);
  const ledgerRef = useRef(null);

  // ── DB row mappers: Supabase snake_case → app camelCase ──
  const fromDB = (row) => ({
    id: row.id,
    customerName: row.customer_name,
    phoneNumber: row.phone_number,
    timestamp: row.timestamp,
    status: row.status,
    items: row.items,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    total: Number(row.total),
    notes: row.notes || ''
  });

  const dirFromDB = (row) => ({
    phone: row.phone,
    name: row.name,
    lastTransactionAmount: Number(row.last_transaction_amount),
    totalTransactions: Number(row.total_transactions),
    lastTransactionDate: row.last_transaction_date
  });

  // ── Fetch all data from Supabase on mount ──
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setDbError('');
      const [{ data: receipts, error: rErr }, { data: clients, error: dErr }] = await Promise.all([
        supabase.from('receipts').select('*').order('created_at', { ascending: false }),
        supabase.from('directory').select('*').order('last_transaction_date', { ascending: false })
      ]);
      if (rErr || dErr) {
        setDbError(`DB_ERROR: ${(rErr || dErr).message}`);
      } else {
        const mapped = (receipts || []).map(fromDB);
        setLedger(mapped);
        setActiveReceipt(mapped[0] || null);
        setDirectory((clients || []).map(dirFromDB));
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem("receiptgen_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("receiptgen_currency", currencySymbol);
  }, [currencySymbol]);

  useEffect(() => {
    localStorage.setItem("receiptgen_vatRate", vatRate.toString());
  }, [vatRate]);

  useEffect(() => {
    localStorage.setItem("receiptgen_showQRCode", showQRCode.toString());
  }, [showQRCode]);

  useEffect(() => {
    localStorage.setItem("receiptgen_showBarcode", showBarcode.toString());
  }, [showBarcode]);

  useEffect(() => {
    localStorage.setItem("receiptgen_showWarranty", showWarranty.toString());
  }, [showWarranty]);

  useEffect(() => {
    localStorage.setItem("receiptgen_showGreetings", showGreetings.toString());
  }, [showGreetings]);

  // System Time ticker
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setSystemTime(d.toISOString().replace('T', ' ').substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live QR Code generation
  useEffect(() => {
    if (activeReceipt && qrCanvasRef.current && showQRCode) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        `https://verify.chukstechnology.ng/tx/${activeReceipt.id}`,
        {
          width: 68,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) console.error("QR Code Error: ", error);
        }
      );
    }
  }, [activeReceipt, showQRCode]);

  // Entrance stagger GSAP animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out", duration: 0.9 } });
    gsap.set(".gsap-reveal", { opacity: 0 });

    tl.to(containerRef.current, { opacity: 1, duration: 0.4 })
      .fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1 }, "-=0.2")
      .fromTo(analyticsRef.current, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1 }, "-=0.5")
      .fromTo(
        [generatorRef.current, previewRef.current, directoryRef.current, ledgerRef.current],
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.12 },
        "-=0.6"
      );
  }, []);

  const handleApplyPreset = (presetKey) => {
    if (presetTemplates[presetKey]) {
      setItems(presetTemplates[presetKey]);
      if (presetKey === 'oledRepair') {
        setTransactionStatus("DIAGNOSING");
      } else {
        setTransactionStatus("SALES");
      }
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { name: "", price: "", cost: "", quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      setItems([{ name: "", price: "", cost: "", quantity: 1 }]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Live Math calculations
  const subtotalVal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
  }, [items]);

  const taxVal = useMemo(() => {
    return subtotalVal * (vatRate / 100);
  }, [subtotalVal, vatRate]);

  const totalVal = subtotalVal + taxVal;

  // Real-time Analytics Tracker with Net Profit Margin
  const analytics = useMemo(() => {
    const totalVolume = ledger.reduce((sum, rx) => sum + rx.total, 0);
    const activeClients = directory.length;
    const aov = ledger.length > 0 ? totalVolume / ledger.length : 0;

    // Profit margin calculation (Item price - Item cost) * quantity
    const totalProfit = ledger.reduce((sum, rx) => {
      const receiptProfit = rx.items.reduce((itemSum, item) => {
        const cost = item.cost !== undefined ? item.cost : (item.price * 0.7); // Fallback: 30% margin if cost missing
        return itemSum + ((item.price - cost) * item.quantity);
      }, 0);
      return sum + receiptProfit;
    }, 0);

    return { totalVolume, totalProfit, activeClients, aov };
  }, [ledger, directory]);

  // Execute Receipt — persists to Supabase then updates local state optimistically
  const handleExecuteReceipt = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) { setErrorMessage('EXECUTION FAILED: CUSTOMER NAME REQUIRED'); return; }
    if (!phoneNumber.trim()) { setErrorMessage('EXECUTION FAILED: PHONE CONTACT REQUIRED'); return; }
    const validItems = items.filter(i => i.name.trim() !== '' && parseFloat(i.price) >= 0);
    if (validItems.length === 0) { setErrorMessage('EXECUTION FAILED: AT LEAST ONE VALID ITEM REQUIRED'); return; }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const receiptId = `RG-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear().toString().slice(-2)}`;

    const newReceipt = {
      id: receiptId,
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      timestamp,
      status: transactionStatus,
      items: validItems.map(i => ({
        name: i.name.trim(),
        price: parseFloat(i.price),
        cost: i.cost ? parseFloat(i.cost) : parseFloat(i.price) * 0.7,
        quantity: parseInt(i.quantity) || 1
      })),
      subtotal: subtotalVal,
      tax: taxVal,
      total: totalVal,
      notes: notes.trim()
    };

    // ── Insert receipt into Supabase ──
    const { error: insertErr } = await supabase.from('receipts').insert({
      id: newReceipt.id,
      customer_name: newReceipt.customerName,
      phone_number: newReceipt.phoneNumber,
      timestamp: newReceipt.timestamp,
      status: newReceipt.status,
      items: newReceipt.items,
      subtotal: newReceipt.subtotal,
      tax: newReceipt.tax,
      total: newReceipt.total,
      notes: newReceipt.notes
    });

    if (insertErr) {
      setErrorMessage(`DB ERROR: ${insertErr.message}`);
      return;
    }

    // ── Upsert client into directory ──
    const existingClient = directory.find(
      c => c.phone.replace(/[^0-9]/g, '') === phoneNumber.trim().replace(/[^0-9]/g, '')
    );
    const clientRow = {
      phone: phoneNumber.trim(),
      name: customerName.trim(),
      last_transaction_amount: totalVal,
      total_transactions: existingClient ? existingClient.totalTransactions + 1 : 1,
      last_transaction_date: timestamp
    };
    await supabase.from('directory').upsert(clientRow, { onConflict: 'phone' });

    // ── Optimistic local state update ──
    setLedger(prev => [newReceipt, ...prev]);
    setDirectory(prev => {
      const idx = prev.findIndex(c => c.phone.replace(/[^0-9]/g, '') === phoneNumber.trim().replace(/[^0-9]/g, ''));
      const clientObj = dirFromDB(clientRow);
      if (idx >= 0) { const u = [...prev]; u[idx] = clientObj; return u; }
      return [clientObj, ...prev];
    });
    setActiveReceipt(newReceipt);

    setCustomerName('');
    setPhoneNumber('');
    setItems([{ name: '', price: '', cost: '', quantity: 1 }]);
    setNotes('');
    setTransactionStatus('SALES');

    gsap.fromTo(previewRef.current,
      { borderColor: theme === 'blueprint' ? '#00F0FF' : '#3378FF' },
      { borderColor: theme === 'blueprint' ? '#163860' : '#262626', duration: 1 }
    );
  };

  const handleReopenReceipt = (receipt) => {
    setCustomerName(receipt.customerName);
    setPhoneNumber(receipt.phoneNumber);
    setItems(receipt.items.map(item => ({
      name: item.name,
      price: item.price.toString(),
      cost: item.cost !== undefined ? item.cost.toString() : "",
      quantity: item.quantity
    })));
    setNotes(receipt.notes || "");
    setTransactionStatus(receipt.status || "SALES");
    setActiveReceipt(receipt);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    gsap.fromTo(generatorRef.current,
      { borderColor: theme === 'blueprint' ? '#00F0FF' : '#3378FF' },
      { borderColor: theme === 'blueprint' ? '#163860' : '#262626', duration: 1 }
    );
  };

  const handlePrintReceipt = (receipt) => {
    setActiveReceipt(receipt);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Update receipt status — optimistic UI + persist to Supabase
  const handleUpdateReceiptStatus = async (receiptId, newStatus) => {
    setLedger(prevLedger =>
      prevLedger.map(rx => rx.id === receiptId ? { ...rx, status: newStatus } : rx)
    );
    if (activeReceipt && activeReceipt.id === receiptId) {
      setActiveReceipt(prev => ({ ...prev, status: newStatus }));
    }
    await supabase.from('receipts').update({ status: newStatus }).eq('id', receiptId);
  };

  // Dynamic outreach message based on the most-recent matching transaction's repair status
  const getOutreachMessage = (client) => {
    const matchingReceipt = ledger.find(
      l => l.phoneNumber.replace(/[^0-9]/g, '') === client.phone.replace(/[^0-9]/g, '')
    );
    const receiptId = matchingReceipt ? matchingReceipt.id : "RG-TX";
    const status = matchingReceipt ? (matchingReceipt.status || "SALES") : "SALES";

    const baseMessage = STATUS_OUTREACH_MESSAGES[status] || STATUS_OUTREACH_MESSAGES.SALES;

    return baseMessage
      .replace(/{name}/g, client.name)
      .replace(/{total}/g, `${currencySymbol}${client.lastTransactionAmount.toFixed(2)}`)
      .replace(/{date}/g, client.lastTransactionDate)
      .replace(/{id}/g, receiptId);
  };

  const getWhatsAppLink = (client) => {
    const cleanPhone = client.phone.replace(/[^0-9]/g, '');
    const text = getOutreachMessage(client);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleExportCSV = () => {
    const headers = ["Client Name", "Phone Contact", "Last Transaction Amount", "Invoices Count", "Last Active Timestamp"];
    const rows = directory.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.lastTransactionAmount.toFixed(2),
      c.totalTransactions,
      c.lastTransactionDate
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `receiptgen_outreach_directory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDirectory = useMemo(() => {
    return directory.filter(c =>
      c.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      c.phone.includes(directorySearch)
    );
  }, [directory, directorySearch]);

  const filteredLedger = useMemo(() => {
    return ledger.filter(rx =>
      rx.id.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      rx.customerName.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      rx.phoneNumber.includes(ledgerSearch)
    );
  }, [ledger, ledgerSearch]);

  const handleCopyJSON = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Dynamic Warranty Countdown Calculator
  // Timestamps are stored as local-time strings (no timezone), parsed without 'Z' suffix
  // to correctly represent Chuks Technology's Lagos (WAT/UTC+1) local time.
  const getWarrantyCountdownText = (receipt) => {
    if (!receipt) return { status: "EXPIRED", label: "", text: "NO TRANSACTION LOADED" };

    // Parse as local time (no 'Z') — timestamps are stored in shop's local timezone
    const rxDate = new Date(receipt.timestamp.replace(' ', 'T'));
    if (isNaN(rxDate.getTime())) {
      return { status: "EXPIRED", label: "", text: "INVALID TIMESTAMP" };
    }

    const now = new Date();
    const diffMs = now.getTime() - rxDate.getTime();
    if (diffMs < 0) {
      // Future-dated receipt (e.g. from seed data) — treat as active
      return { status: "ACTIVE", label: "7-Day Return Policy", text: "ACTIVE // WARRANTY VALID" };
    }

    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Detect repair jobs by keywords — these get 14-day warranty; sales get 7-day return policy
    const isRepair = receipt.items.some(item =>
      /fix|repair|oled|screen|replace|swap|service|charge.?port/i.test(item.name)
    );

    const limitDays = isRepair ? 14 : 7;
    const label = isRepair ? "14-Day Repair Warranty" : "7-Day Sales Return Policy";

    if (diffDays > limitDays) {
      return { status: "EXPIRED", label, text: "WARRANTY EXPIRED" };
    }

    const msLeft = (limitDays * 24 * 60 * 60 * 1000) - diffMs;
    const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minsLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

    const timeText = daysLeft >= 1
      ? `${daysLeft}d ${hoursLeft}h Left`
      : `${hoursLeft}h ${minsLeft}m Left`;

    return { status: "ACTIVE", label, text: `ACTIVE // ${timeText}` };
  };

  const warrantyData = useMemo(() => {
    return getWarrantyCountdownText(activeReceipt);
  }, [activeReceipt, systemTime]); // updates matching clock ticker seconds

  // Theme variable maps
  const isBlueprint = theme === 'blueprint';
  const cCanvas = isBlueprint ? 'bg-[#050C1A] text-cyan-100' : 'bg-brand-bg-canvas text-neutral-200';
  const cPanel = isBlueprint ? 'bg-[#0B1C33] border-[#163860]' : 'bg-brand-bg-panel border-brand-border';
  const cBorder = isBlueprint ? 'border-[#163860]' : 'border-brand-border';
  const cTextAccent = isBlueprint ? 'text-[#00F0FF]' : 'text-brand-accent';
  const cBtnAccent = isBlueprint
    ? 'bg-[#00F0FF] hover:bg-[#33F5FF] text-black border-[#00F0FF] hover:border-[#33F5FF]'
    : 'bg-brand-accent hover:bg-blue-600 text-white border-brand-accent hover:border-blue-500';
  const cBtnOutline = isBlueprint
    ? 'text-[#00F0FF] hover:text-white border-[#00F0FF]/30 hover:border-[#00F0FF]'
    : 'text-brand-accent hover:text-white border-brand-accent/30 hover:border-brand-accent';
  const cInput = isBlueprint
    ? 'bg-[#040C17] border-[#163860] focus:border-[#00F0FF] text-white'
    : 'bg-[#0A0A0A] border-brand-border focus:border-brand-accent text-white';

  return (
    <div ref={containerRef} className={`min-h-screen ${cCanvas} px-4 py-6 md:p-8 flex flex-col font-sans transition-all duration-300`}>

      {/* 1. HEADER PANEL */}
      <header ref={headerRef} className={`w-full border-thin ${cPanel} p-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print gsap-reveal`}>
        <div>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 ${isBlueprint ? 'bg-[#00F0FF]' : 'bg-brand-accent'} animate-pulse`}></span>
            <h1 className="font-mono text-3xl font-extrabold tracking-tightest leading-none flex items-baseline gap-1 text-white">
              <span>CHUKS</span>
              <span className="text-wireframe text-white select-none">TECHNOLOGY</span>
            </h1>
          </div>
          <p className="text-xs text-neutral-500 font-mono tracking-wider mt-1.5 uppercase">// PHONE SALES, ACCESSORIES & SERVICE CENTER</p>
        </div>

        {/* System Settings & Live Clock */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11px] md:text-xs">

          {/* Theme switcher */}
          <div className={`flex items-center gap-2 border-r ${cBorder} pr-4 h-6`}>
            <Palette className="w-3.5 h-3.5 text-neutral-500" />
            <button
              onClick={() => setTheme(isBlueprint ? 'charcoal' : 'blueprint')}
              className={`text-[10px] font-bold px-2 py-0.5 border ${isBlueprint ? 'border-[#00F0FF]/30 text-[#00F0FF]' : 'border-neutral-700 text-neutral-400'} uppercase hover:bg-neutral-800/40 transition-colors`}
            >
              MODE: {theme}
            </button>
          </div>

          {/* Currency selection */}
          <div className={`flex items-center gap-2 border-r ${cBorder} pr-4 h-6`}>
            <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="$" className="bg-[#111]">USD ($)</option>
              <option value="₦" className="bg-[#111]">NGN (₦)</option>
              <option value="€" className="bg-[#111]">EUR (€)</option>
              <option value="£" className="bg-[#111]">GBP (£)</option>
              <option value="¥" className="bg-[#111]">JPY/CNY (¥)</option>
            </select>
          </div>

          {/* Clock stamp */}
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span className={`${cTextAccent} min-w-[140px]`}>{systemTime || "CLOCKING..."}</span>
          </div>

        </div>
      </header>

      {/* 2. REAL-TIME METRICS BANNER */}
      <section ref={analyticsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print gsap-reveal">

        <div className={`border-thin ${cPanel} p-4 flex items-center justify-between`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">SYS_TOTAL_REVENUE</span>
            <span className="text-xl font-mono font-extrabold text-white mt-1.5">
              {currencySymbol}{analytics.totalVolume.toFixed(2)}
            </span>
          </div>
          <TrendingUp className={`w-5 h-5 ${cTextAccent} opacity-80`} />
        </div>

        <div className={`border-thin ${cPanel} p-4 flex items-center justify-between`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">ACTIVE_DIRECTORY_POOL</span>
            <span className="text-xl font-mono font-extrabold text-white mt-1.5">
              {analytics.activeClients} CORES
            </span>
          </div>
          <Users className={`w-5 h-5 ${cTextAccent} opacity-80`} />
        </div>

        <div className={`border-thin ${cPanel} p-4 flex items-center justify-between`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">AVERAGE_TICKET_VAL</span>
            <span className="text-xl font-mono font-extrabold text-white mt-1.5">
              {currencySymbol}{analytics.aov.toFixed(2)}
            </span>
          </div>
          <Layers className={`w-5 h-5 ${cTextAccent} opacity-80`} />
        </div>

        {/* Customized: NET PROFIT MARGIN TRACKER */}
        <div className={`border-thin ${cPanel} p-4 flex items-center justify-between`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">NET_PROFIT_MARGIN</span>
            <span className="text-xl font-mono font-extrabold text-green-400 mt-1.5">
              {currencySymbol}{analytics.totalProfit.toFixed(2)}
            </span>
          </div>
          <Percent className="w-5 h-5 text-green-400 opacity-80" />
        </div>

      </section>

      {/* 3. MAIN DASHBOARD GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 print:block">

        {/* LEFT COLUMN: generator form and client database directory (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 no-print print:hidden">

          {/* GENERATOR INPUTS PANEL */}
          <section ref={generatorRef} className={`border-thin ${cPanel} p-6 flex flex-col gap-5 relative gsap-reveal`}>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${cTextAccent} stroke-[1.5]`} />
                <h2 className="font-mono text-base font-extrabold tracking-tightest uppercase text-white">
                  TRANSACTION_INPUTS // <span className="text-wireframe text-white">01</span>
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">// AUTO_STAMP_STATION</span>
            </div>

            {errorMessage && (
              <div className="border border-red-500 bg-red-950/20 text-red-400 p-3 flex items-center gap-2.5 font-mono text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleExecuteReceipt} className="flex flex-col gap-4">

              {/* Customer Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-neutral-400 uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-neutral-500" />
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`${cInput} px-3 py-2 text-sm focus:outline-none transition-colors font-mono`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-neutral-400 uppercase flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-500" />
                    Phone Contact
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +2348031122334"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`${cInput} px-3 py-2 text-sm focus:outline-none transition-colors font-mono`}
                  />
                </div>
              </div>

              {/* Status Selector & VAT Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Repair Status Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-neutral-400 uppercase flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-500" />
                    Initial Repair Status
                  </label>
                  <select
                    value={transactionStatus}
                    onChange={(e) => setTransactionStatus(e.target.value)}
                    className={`${cInput} px-3 py-2 text-sm focus:outline-none transition-colors font-mono`}
                  >
                    <option value="SALES" className="bg-[#111]">SALES (Accessory/Device Purchase)</option>
                    <option value="DIAGNOSING" className="bg-[#111]">DIAGNOSING (Fault Assessment)</option>
                    <option value="REPAIRING" className="bg-[#111]">REPAIRING (Active Servicing)</option>
                    <option value="READY_FOR_PICKUP" className="bg-[#111]">READY FOR PICKUP (Fixed/Tested)</option>
                    <option value="COMPLETED" className="bg-[#111]">COMPLETED (Closed/Delivered)</option>
                  </select>
                </div>

                {/* VAT configuration */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-neutral-400 uppercase flex items-center gap-1.5 justify-between">
                    <span>VAT Rate (%)</span>
                    <span className={`${cTextAccent} font-bold`}>{vatRate.toFixed(1)}%</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={vatRate}
                      onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                      className="flex-1 h-1 bg-zinc-800 accent-[#3378FF] cursor-pointer"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={vatRate}
                      onChange={(e) => setVatRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                      className={`${cInput} w-16 px-1.5 py-1.5 text-center text-xs focus:outline-none font-mono`}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Receipt config toggles */}
              <div className="border border-zinc-800 bg-[#050B15]/40 p-3.5 flex flex-col gap-3 font-mono text-[11px]">
                <span className="text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-neutral-500" />
                  RECEIPT TICKET CONFIGURATOR (SHOW/HIDE ELEMENTS)
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1">
                  <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showQRCode}
                      onChange={(e) => setShowQRCode(e.target.checked)}
                      className="rounded-none border-zinc-800 bg-black text-[#3378FF] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>QR Verification</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showBarcode}
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="rounded-none border-zinc-800 bg-black text-[#3378FF] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Barcode</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showWarranty}
                      onChange={(e) => setShowWarranty(e.target.checked)}
                      className="rounded-none border-zinc-800 bg-black text-[#3378FF] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Warranty Info</span>
                  </label>
                  <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showGreetings}
                      onChange={(e) => setShowGreetings(e.target.checked)}
                      className="rounded-none border-zinc-800 bg-black text-[#3378FF] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>Language Tags</span>
                  </label>
                </div>
              </div>

              {/* Template presets section */}
              <div className="flex flex-col gap-2 mt-1">
                <label className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">// LOAD_CHUKS_SERVICE_PRESETS</label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('phoneSale')}
                    className={`text-[10px] font-mono px-3 py-1 border ${cBorder} text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800/30`}
                  >
                    PHONE SALE
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('oledRepair')}
                    className={`text-[10px] font-mono px-3 py-1 border ${cBorder} text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800/30`}
                  >
                    OLED SCREEN FIX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('accessories')}
                    className={`text-[10px] font-mono px-3 py-1 border ${cBorder} text-neutral-400 hover:text-white transition-colors hover:bg-neutral-800/30`}
                  >
                    ACCESSORIES PACK
                  </button>
                </div>
              </div>

              {/* Item Grid */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center border-b border-zinc-800 border-dashed pb-1.5 mb-1.5">
                  <span className="font-mono text-xs text-neutral-400 uppercase">// PURCHASED_ITEMS_GRID (WITH PROFIT ESTIMATION)</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className={`flex items-center gap-1 text-[11px] font-mono ${cBtnOutline} px-2 py-0.5 transition-colors uppercase`}
                  >
                    <Plus className="w-3 h-3" />
                    Add Row
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">

                    {/* Item Name */}
                    <div className="col-span-4 md:col-span-5">
                      <input
                        type="text"
                        placeholder="Device model sale or repair tag..."
                        value={item.name}
                        required
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        className={`w-full ${cInput} px-2.5 py-1.5 text-xs focus:outline-none transition-colors font-mono`}
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-3 md:col-span-3 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-600 text-[10px] font-mono">{currencySymbol} Price</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        required
                        value={item.price}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        className={`w-full ${cInput} pl-10 pr-2 py-1.5 text-xs focus:outline-none transition-colors font-mono`}
                      />
                    </div>

                    {/* Cost (Profit estimation helper) */}
                    <div className="col-span-3 md:col-span-3 relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-600 text-[10px] font-mono">{currencySymbol} Cost</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cost"
                        value={item.cost}
                        onChange={(e) => handleItemChange(index, "cost", e.target.value)}
                        className={`w-full ${cInput} pl-9 pr-2 py-1.5 text-xs focus:outline-none transition-colors font-mono border-dashed`}
                        title="Your purchase/parts cost (not visible on the receipt printout)"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                        className={`w-full ${cInput} px-1 py-1.5 text-xs focus:outline-none transition-colors font-mono text-center`}
                      />
                    </div>

                    {/* Remove item row */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={items.length === 1 && item.name === "" && item.price === ""}
                        className="text-neutral-500 hover:text-red-500 disabled:text-neutral-800 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Memo/Warranty Note details */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="font-mono text-xs text-neutral-400 uppercase">// Memo / Transaction Notes</label>
                <textarea
                  placeholder="e.g. Battery health 90%, 14-days screens warranty, etc..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`w-full ${cInput} px-3 py-2 text-xs focus:outline-none transition-colors font-mono resize-none`}
                />
              </div>

              {/* Calculations Block */}
              <div className="mt-4 border-t border-zinc-800 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-6 font-mono text-xs text-neutral-400">
                  <div>
                    SUBTOTAL: <span className="text-white font-semibold">{currencySymbol}{subtotalVal.toFixed(2)}</span>
                  </div>
                  <div>
                    VAT ({vatRate}%): <span className="text-white font-semibold">{currencySymbol}{taxVal.toFixed(2)}</span>
                  </div>
                  <div className={`${cTextAccent} border-l ${cBorder} pl-6`}>
                    TOTAL DUE: <span className="text-white font-bold">{currencySymbol}{totalVal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full md:w-auto ${cBtnAccent} font-mono text-xs font-bold uppercase tracking-wider px-6 py-2.5 transition-all flex items-center justify-center gap-2 shrink-0 grayscale hover:grayscale-0 active:translate-y-[1px]`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Execute System Receipt
                </button>
              </div>

            </form>
          </section>

          {/* OUTREACH DIRECTORY */}
          <section ref={directoryRef} className={`border-thin ${cPanel} p-6 flex flex-col gap-4 gsap-reveal`}>

            <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-zinc-800 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${cTextAccent} stroke-[1.5]`} />
                <h2 className="font-mono text-base font-extrabold tracking-tightest uppercase text-white">
                  CLIENT_OUTREACH_DIRECTORY // <span className="text-wireframe text-white">02</span>
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search directory..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="bg-[#050C1A]/60 border border-zinc-800 pl-8 pr-2.5 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent text-white"
                  />
                </div>

                <button
                  onClick={handleExportCSV}
                  className={`flex items-center gap-1.5 text-[11px] font-mono border ${cBorder} text-neutral-400 hover:text-white px-3 py-1 transition-colors uppercase`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Dynamic Outreach Preview — renders current active receipt's status-aware message */}
            <div className="border border-zinc-800 bg-neutral-950/20 p-3.5 flex flex-col gap-2.5 font-mono text-[11px]">
              <span className="text-neutral-500 uppercase tracking-widest">// DYNAMIC OUTREACH ENGINE // STATUS-AWARE PREVIEW</span>
              <span className="text-neutral-600 text-[9px] uppercase">// TEMPLATE UPDATES AUTOMATICALLY BASED ON ACTIVE RECEIPT REPAIR STATUS</span>
              <div className="bg-[#050B15] border border-zinc-800 px-3 py-2 text-white italic min-h-[40px] text-xs leading-relaxed">
                {activeReceipt
                  ? `"${getOutreachMessage({ name: activeReceipt.customerName, phone: activeReceipt.phoneNumber, lastTransactionAmount: activeReceipt.total, lastTransactionDate: activeReceipt.timestamp })}"`
                  : <span className="text-neutral-600 not-italic">// No transaction loaded. Create or select one from the ledger.</span>
                }
              </div>
            </div>

            {/* Client database list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-neutral-500 uppercase pb-2">
                    <th className="py-2.5 font-semibold">Client Name</th>
                    <th className="py-2.5 font-semibold">Phone Contact</th>
                    <th className="py-2.5 font-semibold text-right">Last TX Amount</th>
                    <th className="py-2.5 font-semibold text-center">TXS Count</th>
                    <th className="py-2.5 font-semibold text-right">Outreach Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredDirectory.map((client) => (
                    <tr key={client.phone} className="group hover:bg-neutral-800/10 transition-colors">
                      <td className="py-3 text-white font-medium">{client.name}</td>
                      <td className="py-3 text-neutral-400">{client.phone}</td>
                      <td className="py-3 text-right text-white font-semibold">{currencySymbol}{client.lastTransactionAmount.toFixed(2)}</td>
                      <td className="py-3 text-center text-neutral-500">{client.totalTransactions}</td>
                      <td className="py-3 text-right">
                        <a
                          href={getWhatsAppLink(client)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[10px] ${cTextAccent} border border-brand-accent/20 hover:border-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10 px-2.5 py-1 transition-colors uppercase`}
                        >
                          <span>WA Chat</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {filteredDirectory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-neutral-600">
                        NO CLIENTS MATCHING SEARCH CRITERIA
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>

        </div>

        {/* RIGHT COLUMN: blueprint visual slip and ledger logs timeline (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 print:w-full print:p-0 print:border-none print:m-0">

          {/* VISUAL RECEIPT PREVIEW BLUEPRINT */}
          <section ref={previewRef} className={`border-thin ${cPanel} p-6 flex flex-col gap-4 relative print-container no-print print:hidden gsap-reveal`}>

            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className={`w-4 h-4 ${cTextAccent} stroke-[1.5]`} />
                <h2 className="font-mono text-base font-extrabold tracking-tightest uppercase text-white">
                  LIVE_BLUEPRINT_VIEW // <span className="text-wireframe text-white">03</span>
                </h2>
              </div>
              <button
                onClick={() => handlePrintReceipt(activeReceipt)}
                className={`flex items-center gap-1.5 text-[11px] font-mono ${cBtnOutline} px-3 py-1 transition-all uppercase grayscale hover:grayscale-0`}
              >
                <Printer className="w-3.5 h-3.5" />
                Print (CMD+P)
              </button>
            </div>

            {/* Simulated Printed invoice ticket */}
            <div className="bg-[#0D0D0D] border border-neutral-800 p-5 font-mono text-xs flex flex-col gap-4 text-neutral-300 relative overflow-hidden print:border-0 print:bg-white print:text-black print:p-0">

              {/* Dynamic Real-time Warranty Badge */}
              {activeReceipt && (
                <div className={`absolute top-2.5 right-3 px-2 py-0.5 border text-[9px] uppercase font-bold tracking-widest no-print ${warrantyData.status === "ACTIVE"
                  ? 'border-green-500/40 bg-green-950/20 text-green-400'
                  : 'border-red-500/40 bg-red-950/20 text-red-400'
                  }`}>
                  {warrantyData.text}
                </div>
              )}

              {/* Coordinates stamp */}
              <div className="text-[8px] text-neutral-700 select-none print:hidden font-mono uppercase block mb-1">
                COORDS: 6.5937° N, 3.3422° E // OTIGBA ST.
              </div>

              {/* Receipt Header details */}
              <div className="flex justify-between items-start border-b border-neutral-800 border-dashed pb-4 gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <img src={logo} alt="Chuks Technology" className="h-7 w-auto object-contain" />
                  </div>
                  <span className={`${cTextAccent} font-bold tracking-widest text-sm print:text-black uppercase`}>CHUKS TECHNOLOGY</span>
                  <span className="text-[9px] text-neutral-500 uppercase mt-0.5">PHONE SALES, ACCESSORIES & REPAIRS</span>
                  <span className="text-[8px] text-neutral-600 print:text-neutral-500 uppercase">No. 18 Otigba Street, Computer Village, Ikeja, Lagos</span>

                  {/* Ledger status display on visual invoice */}
                  <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px]">
                    <span className="text-neutral-500 uppercase">REPAIR STATE:</span>
                    <span className={`px-1.5 py-0.5 font-bold ${activeReceipt?.status === 'READY_FOR_PICKUP' ? 'bg-green-500 text-black' :
                      activeReceipt?.status === 'REPAIRING' ? 'bg-yellow-500 text-black' :
                        activeReceipt?.status === 'DIAGNOSING' ? 'bg-blue-500 text-black' :
                          activeReceipt?.status === 'COMPLETED' ? 'bg-neutral-700 text-white' :
                            'bg-[#3378FF] text-white'
                      }`}>
                      {activeReceipt?.status || 'SALES'}
                    </span>
                  </div>

                  <span className="text-[9px] text-neutral-600 print:text-neutral-500 uppercase mt-2">SYS_REF: {activeReceipt?.id}</span>
                  <span className="text-[9px] text-neutral-600 print:text-neutral-500 uppercase">DATE: {activeReceipt?.timestamp}</span>
                </div>

                {/* Verification QR Code Canvas */}
                {showQRCode && (
                  <div className="shrink-0 bg-white p-1 border border-neutral-800 print:border-black">
                    <canvas ref={qrCanvasRef} className="w-16 h-16 block" />
                  </div>
                )}
              </div>

              {/* Customer Metadata Block */}
              <div className="flex flex-col gap-1 border-b border-neutral-800 border-dashed pb-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">CUSTOMER:</span>
                  <span className="text-white font-semibold print:text-black">{activeReceipt?.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 uppercase">CONTACT:</span>
                  <span className="text-neutral-300 print:text-black">{activeReceipt?.phoneNumber}</span>
                </div>
              </div>

              {/* Products item table grid */}
              <div className="flex flex-col gap-2 py-1 min-h-[100px]">
                <div className="flex justify-between text-neutral-500 font-semibold border-b border-neutral-850 pb-1 text-[10px]">
                  <span>ITEM DESCRIPTION</span>
                  <div className="flex gap-8">
                    <span>QTY</span>
                    <span className="w-14 text-right">TOTAL</span>
                  </div>
                </div>

                {activeReceipt?.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline gap-2">
                    <span className="text-neutral-300 print:text-black truncate max-w-[160px] md:max-w-[200px]" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex gap-8 shrink-0">
                      <span className="text-neutral-500 font-medium">x{item.quantity}</span>
                      <span className="w-14 text-right text-white print:text-black font-semibold">
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals computation */}
              <div className="border-t border-neutral-800 border-dashed pt-3 flex flex-col gap-1 text-right">
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500 uppercase">SUBTOTAL:</span>
                  <span className="text-neutral-300 print:text-black">{currencySymbol}{activeReceipt?.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-neutral-500 uppercase">VAT/TAX ({vatRate}%):</span>
                  <span className="text-neutral-300 print:text-black">{currencySymbol}{activeReceipt?.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-neutral-800 pt-2 text-white print:text-black mt-1">
                  <span className={`uppercase ${cTextAccent} print:text-black`}>TOTAL DUE:</span>
                  <span>{currencySymbol}{activeReceipt?.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Custom notes/memo printed on the ticket */}
              {activeReceipt?.notes && (
                <div className="border-t border-neutral-800 border-dashed pt-3">
                  <span className="text-neutral-500 text-[9px] uppercase block mb-1">TRANSACTION MEMO:</span>
                  <p className="text-neutral-400 print:text-black italic leading-relaxed text-[10px]">
                    "{activeReceipt.notes}"
                  </p>
                </div>
              )}

              {/* Strict Return Policy & Phone Repair Warranty */}
              {showWarranty && (
                <div className="border-t border-neutral-800 border-dashed pt-3 pb-1 flex flex-col gap-1 font-mono text-[9px] leading-normal text-neutral-500">
                  <div className="flex items-center gap-1 text-red-500 font-bold uppercase mb-0.5 print:text-black">
                    <ShieldCheck className="w-3 h-3 text-red-500 print:text-black" />
                    <span>WARRANTY STAMP // {warrantyData.label}:</span>
                  </div>
                  <p className="italic">
                    1. Goods bought in good condition are not returnable after one week (7 days).
                  </p>
                  <p className="italic">
                    2. Device repair screens/parts have 14 days warranty. Liquid or screen break voids warranty.
                  </p>
                </div>
              )}

              {/* Visual technical barcode */}
              {showBarcode && (
                <div className="mt-2 flex flex-col items-center gap-1 border-t border-neutral-850 pt-3">
                  <div className="flex items-stretch h-8 gap-[1px] opacity-80 print:opacity-100">
                    {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 1, 4, 2].map((w, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-400 print:bg-black"
                        style={{ width: `${w}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-neutral-600 print:text-neutral-500 font-mono tracking-[0.25em]">
                    *{activeReceipt?.id.replace(/-/g, '')}*
                  </span>
                </div>
              )}

              {/* Localized Greetings (Engaging/Lively Footer) */}
              {showGreetings && (
                <div className="text-center text-[10px] text-neutral-400 border-t border-neutral-900 pt-3 mt-1 uppercase print:text-neutral-500 font-bold tracking-widest flex flex-col gap-0.5">
                  <span>// THANK YOU FOR YOUR PATRONAGE! //</span>
                  <span className="text-[8px] text-neutral-500 font-semibold tracking-wider">IMELA // ESE // NAGODE</span>
                </div>
              )}

            </div>

          </section>

          {/* LEDGER HISTORY TIMELINE */}
          <section ref={ledgerRef} className={`border-thin ${cPanel} p-6 flex flex-col gap-4 no-print print:hidden gsap-reveal`}>

            <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-zinc-800 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${cTextAccent} stroke-[1.5]`} />
                <h2 className="font-mono text-base font-extrabold tracking-tightest uppercase text-white">
                  LEDGER_TRANSACTIONS_LOG // <span className="text-wireframe text-white">04</span>
                </h2>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="bg-[#050C1A]/60 border border-zinc-800 pl-8 pr-2.5 py-1 text-[11px] font-mono focus:outline-none focus:border-brand-accent text-white"
                />
              </div>
            </div>

            {/* Ledger Stream list */}
            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredLedger.map((receipt) => (
                <div
                  key={receipt.id}
                  className={`border-thin p-3.5 flex flex-col gap-2.5 transition-all cursor-pointer ${activeReceipt?.id === receipt.id
                    ? isBlueprint ? 'border-[#00F0FF] bg-[#00F0FF]/5' : 'border-brand-accent bg-brand-accent/5'
                    : 'border-zinc-800 hover:border-neutral-700 bg-neutral-950/20'
                    }`}
                  onClick={() => setActiveReceipt(receipt)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-xs text-white font-bold">{receipt.id}</span>
                      <span className="text-[9px] text-neutral-600 uppercase">// {receipt.timestamp}</span>
                    </div>
                    <span className={`font-mono text-xs ${cTextAccent} font-bold`}>
                      {currencySymbol}{receipt.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Customer, cost, and repair status options */}
                  <div className="flex flex-col gap-2 font-mono text-[11px]">
                    <div className="flex justify-between items-center text-neutral-400">
                      <div>
                        <span>CLIENT: </span>
                        <span className="text-white">{receipt.customerName}</span>
                      </div>
                      <span className="text-neutral-500 text-[10px]">{receipt.items.length} lines</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-zinc-900 pt-2 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-600 uppercase text-[9px]">REPAIR STATUS:</span>
                        <select
                          value={receipt.status || "SALES"}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateReceiptStatus(receipt.id, e.target.value)}
                          className="bg-black border border-zinc-850 px-1 py-0.5 text-[10px] text-white focus:outline-none focus:border-brand-accent font-mono cursor-pointer"
                        >
                          <option value="SALES">SALES</option>
                          <option value="DIAGNOSING">DIAGNOSING</option>
                          <option value="REPAIRING">REPAIRING</option>
                          <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>

                      {/* Display estimated margin */}
                      <span className="text-[10px] text-neutral-500">
                        Est. Profit: <span className="text-green-500 font-semibold">{currencySymbol}{(receipt.items.reduce((sum, i) => sum + ((i.price - (i.cost !== undefined ? i.cost : i.price * 0.7)) * i.quantity), 0)).toFixed(1)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center border-t border-zinc-800 border-dashed pt-2.5">
                    <span className="text-[9px] text-neutral-600 font-mono uppercase tracking-wider">
                      STATUS: LOGGED
                    </span>

                    <div className="flex items-center gap-3">
                      {/* JSON Schema modal */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setJsonModalData(receipt);
                        }}
                        className="text-[10px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition-colors uppercase"
                        title="View Raw Data Payload"
                      >
                        <Sliders className="w-3 h-3" />
                        Payload
                      </button>

                      {/* Print */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintReceipt(receipt);
                        }}
                        className={`text-[10px] font-mono ${cTextAccent} hover:text-white flex items-center gap-1 transition-colors uppercase`}
                        title="Print Invoice"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </button>

                      {/* Load */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopenReceipt(receipt);
                        }}
                        className="text-[10px] font-mono text-neutral-400 hover:text-brand-accent flex items-center gap-1 transition-colors uppercase"
                        title="Reopen in Inputs Form"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Load
                      </button>
                    </div>
                  </div>

                </div>
              ))}

              {filteredLedger.length === 0 && (
                <div className="py-12 text-center text-neutral-600 font-mono text-xs">
                  NO LEDGER TRANSACTIONS LOGGED.
                </div>
              )}

            </div>

          </section>

        </div>

      </main>

      {/* JSON PAYLOAD MODAL */}
      {jsonModalData && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm flex justify-center items-center p-4 z-50 no-print">
          <div className="bg-[#111111] border border-neutral-800 max-w-xl w-full p-6 flex flex-col gap-4 relative">

            <button
              onClick={() => setJsonModalData(null)}
              className="absolute top-4 right-4 text-xs font-mono text-neutral-500 hover:text-white uppercase transition-colors"
            >
              [ Close ]
            </button>

            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${cTextAccent}`} />
                <h3 className="font-mono text-sm font-extrabold text-white">
                  RAW_RECEIPT_SCHEMA // {jsonModalData.id}
                </h3>
              </div>

              <button
                onClick={() => handleCopyJSON(jsonModalData)}
                className="flex items-center gap-1 text-[11px] font-mono text-brand-accent hover:text-white px-2 py-0.5 border border-brand-accent/30 transition-colors"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-[#070707] border border-neutral-900 p-4 text-[11px] font-mono text-neutral-400 overflow-x-auto max-h-[350px] leading-relaxed select-all">
              {JSON.stringify(jsonModalData, null, 2)}
            </pre>

            <div className="flex justify-between items-center text-[10px] text-neutral-600 font-mono">
              <span>FORMAT: JSON_SCHEMA_OBJECT</span>
              <span>ENGINE: V1.0 // IFECO // CHUKS</span>
            </div>

          </div>
        </div>
      )}

      {/* Print-only media layout wrapper — hidden on screen, shown only when printing */}
      <div className="hidden print:block print-only">
        <div style={{ fontFamily: "'Courier New', Courier, monospace", color: '#000', background: '#fff', maxWidth: '100%' }}>

          {/* ── HEADER BAR ── */}
          <div style={{ background: '#111827', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={logo}
              alt="Chuks Technology"
              style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '0.15em', textTransform: 'uppercase' }}>CHUKS TECHNOLOGY</div>
              <div style={{ fontSize: '9px', opacity: 0.65, textTransform: 'uppercase', marginTop: '3px', letterSpacing: '0.08em' }}>PHONE SALES, ACCESSORIES &amp; SERVICE CENTER</div>
              <div style={{ fontSize: '8px', opacity: 0.45, marginTop: '2px', letterSpacing: '0.04em' }}>No. 18 Otigba Street, Computer Village, Ikeja, Lagos</div>
            </div>
          </div>

          {/* ── REF / TIMESTAMP STRIP ── */}
          <div style={{ background: '#f3f4f6', padding: '7px 24px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', borderBottom: '1px solid #e5e7eb', letterSpacing: '0.03em' }}>
            <span>&#128203; SYS_REF: <strong>{activeReceipt?.id}</strong></span>
            <span>&#128336; {activeReceipt?.timestamp}</span>
          </div>

          <div style={{ padding: '0 24px 24px' }}>

            {/* ── CUSTOMER BLOCK ── */}
            <div style={{ marginTop: '16px', borderLeft: '4px solid #111827', paddingLeft: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px', color: '#374151' }}>Customer Information</div>
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#6b7280', paddingBottom: '4px', width: '32%', fontSize: '9px', textTransform: 'uppercase' }}>Customer:</td>
                    <td style={{ fontWeight: '700', paddingBottom: '4px' }}>{activeReceipt?.customerName}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#6b7280', paddingBottom: '4px', fontSize: '9px', textTransform: 'uppercase' }}>Contact:</td>
                    <td style={{ paddingBottom: '4px' }}>{activeReceipt?.phoneNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#6b7280', fontSize: '9px', textTransform: 'uppercase' }}>Status:</td>
                    <td>
                      <span style={{
                        background:
                          activeReceipt?.status === 'READY_FOR_PICKUP' ? '#16a34a' :
                          activeReceipt?.status === 'REPAIRING' ? '#ca8a04' :
                          activeReceipt?.status === 'DIAGNOSING' ? '#2563eb' :
                          activeReceipt?.status === 'COMPLETED' ? '#4b5563' : '#1d4ed8',
                        color: '#fff',
                        padding: '2px 10px',
                        fontSize: '8px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'inline-block',
                        borderRadius: '2px'
                      }}>
                        {activeReceipt?.status || 'SALES'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── DIVIDER ── */}
            <div style={{ borderTop: '1px dashed #d1d5db', margin: '14px 0' }} />

            {/* ── ITEMS TABLE ── */}
            <div style={{ borderLeft: '4px solid #111827', paddingLeft: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#374151' }}>Items Purchased</div>
            </div>

            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111827', color: '#fff' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '700' }}>Item Description</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', fontWeight: '700' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {activeReceipt?.items.map((item, index) => (
                  <tr key={index} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 8px' }}>{item.name}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'center', color: '#6b7280' }}>x{item.quantity}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', color: '#6b7280' }}>{currencySymbol}{item.price.toFixed(2)}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: '700' }}>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── TOTALS BLOCK ── */}
            <div style={{ border: '1px solid #e5e7eb', borderTop: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '10px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <span style={{ color: '#6b7280', textTransform: 'uppercase' }}>Subtotal:</span>
                <span>{currencySymbol}{activeReceipt?.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '10px', borderBottom: '2px solid #111827', background: '#f9fafb' }}>
                <span style={{ color: '#6b7280', textTransform: 'uppercase' }}>VAT/TAX ({vatRate}%):</span>
                <span>{currencySymbol}{activeReceipt?.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', fontSize: '14px', fontWeight: '900', background: '#111827', color: '#fff', letterSpacing: '0.04em' }}>
                <span>TOTAL DUE:</span>
                <span>{currencySymbol}{activeReceipt?.total.toFixed(2)}</span>
              </div>
            </div>

            {/* ── MEMO BOX ── */}
            {activeReceipt?.notes && (
              <div style={{ marginTop: '14px', background: '#fffbeb', border: '1px solid #fbbf24', padding: '10px 12px', fontSize: '10px' }}>
                <div style={{ fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', color: '#92400e' }}>&#128203; Transaction Memo:</div>
                <div style={{ fontStyle: 'italic', color: '#374151', lineHeight: '1.5' }}>&ldquo;{activeReceipt.notes}&rdquo;</div>
              </div>
            )}

            {/* ── WARRANTY BOX ── */}
            {showWarranty && (
              <div style={{ marginTop: '12px', border: '1px solid #fca5a5', background: '#fff5f5', padding: '10px 12px', fontSize: '9px', lineHeight: '1.7' }}>
                <div style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px', color: '#991b1b' }}>&#9888; WARRANTY &amp; RETURN POLICY // {warrantyData.label}</div>
                <div style={{ color: '#374151' }}>1. Goods bought in good condition are not returnable after one week (7 days).</div>
                <div style={{ color: '#374151' }}>2. Repaired screens/parts have 14 days warranty. Liquid or screen break voids warranty.</div>
              </div>
            )}

            {/* ── BARCODE ── */}
            {showBarcode && (
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'stretch', height: '34px', gap: '1px' }}>
                  {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2,1,4,2,1,3,1,2,1,4,2].map((w, idx) => (
                    <span key={idx} style={{ background: '#111', width: `${w}px`, display: 'inline-block' }} />
                  ))}
                </div>
                <span style={{ fontSize: '9px', letterSpacing: '0.22em', color: '#6b7280', marginTop: '2px' }}>*{activeReceipt?.id?.replace(/-/g, '')}*</span>
              </div>
            )}

            {/* ── FOOTER ── */}
            {showGreetings && (
              <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '2px dashed #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#111827' }}>// THANK YOU FOR YOUR PATRONAGE! //</div>
                <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '3px', letterSpacing: '0.1em' }}>IMELA // ESE // NAGODE</div>
                <div style={{ fontSize: '8px', color: '#9ca3af', marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '6px' }}>ReceiptGen Engine &middot; Chuks Technology &middot; {activeReceipt?.timestamp}</div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
