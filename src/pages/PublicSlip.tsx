import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

// Define the same interface as in ThermalSlip.tsx for consistency
interface SlipData {
    tokenNumber: string;
    studentName: string;
    fatherName: string;
    grade: string;
    date: string;
    contact?: string;
    residency?: string;
    testDate?: string;
    resultDate?: string;
    photoUrl?: string;
    cnic?: string;
    passportNumber?: string;
    bformNumber?: string;
    idType?: "cnic" | "passport" | "bform";
    category?: string;
    statusType?: string;
    age?: string;
}

export default function PublicSlip() {
    const { tokenNumber } = useParams<{ tokenNumber: string }>();
    const [slipData, setSlipData] = useState<SlipData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tokenNumber) {
            setError("Token number is missing.");
            setLoading(false);
            return;
        }

        // Function to search for token data in localStorage
        const findTokenData = () => {
            const keysToSearch = ["jamia_tokens_v1", "tokens"];
            for (const key of keysToSearch) {
                const storedData = localStorage.getItem(key);
                if (storedData) {
                    try {
                        const items = JSON.parse(storedData);
                        if (Array.isArray(items)) {
                            const found = items.find(item => item.tokenNumber === tokenNumber);
                            if (found) return found;
                        }
                    } catch (e) {
                        console.error(`Error parsing ${key} from localStorage`, e);
                    }
                }
            }
            return null;
        };

        const data = findTokenData();

        if (data) {
            // Map the found data to the SlipData interface
            const mappedData: SlipData = {
                tokenNumber: data.tokenNumber,
                studentName: data.studentName || "N/A",
                fatherName: data.fatherName || "N/A",
                grade: data.class || "N/A",
                date: data.issueDate || (() => {
                    try {
                        return new Date().toLocaleDateString('ur-PK');
                    } catch (e) {
                        const now = new Date();
                        return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
                    }
                })(),
                contact: data.contact,
                residency: data.residency,
                testDate: data.testDate,
                resultDate: data.resultDate,
                photoUrl: data.photoUrl, // Assuming photoUrl is stored
                cnic: data.cnic,
                passportNumber: data.passportNumber,
                bformNumber: data.bformNumber,
                idType: data.idType,
                category: data.category,
                statusType: data.statusType,
                age: data.age,
            };
            setSlipData(mappedData);
        } else {
            setError("Token data not found.");
        }
        setLoading(false);
    }, [tokenNumber]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif', color: 'red' }}>Error: {error}</div>;
    }

    if (!slipData) {
        return <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>Token not found.</div>;
    }

    // The QR code should link back to this public page
    const qrCodeData = window.location.href;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <div style={{ width: '320px', background: 'white', color: 'black', borderRadius: '8px', border: '1px solid #ccc', fontFamily: '"Noto Nastaliq Urdu", serif', direction: 'rtl' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    {/* Header */}
                    <div style={{ borderBottom: '2px solid black', paddingBottom: '12px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>جامعہ اسلامیہ دارالعلوم سرحد</h2>
                        <p style={{ fontSize: '14px', margin: '4px 0 0' }}>ٹوکن سلپ</p>
                    </div>

                    {/* Photo, Token, QR */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 5px', gap: '4px', flexWrap: 'nowrap' }}>
                        {/* Photo (Right in RTL) */}
                        <div style={{ flexShrink: 0 }}>
                            {slipData.photoUrl ? (
                                <img
                                    src={slipData.photoUrl}
                                    alt="Student"
                                    style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #eee' }}
                                />
                            ) : (
                                <div style={{ width: '55px', height: '55px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #ddd' }}>
                                    <span style={{ fontSize: '8px', color: '#888' }}>تصویر</span>
                                </div>
                            )}
                        </div>

                        {/* Token Number (Middle) */}
                        <div style={{ textAlign: 'center', flex: '1 1 auto', minWidth: '120px', overflow: 'hidden' }}>
                            <p style={{ fontSize: '10px', color: '#555', margin: 0 }}>ٹوکن نمبر</p>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', margin: '2px 0 0', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{slipData.tokenNumber}</p>
                        </div>

                        {/* QR Code (Left in RTL) */}
                        <div style={{ width: '55px', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <QRCodeSVG value={qrCodeData} size={55} level="H" />
                        </div>
                    </div>

                    {/* Student Info Table */}
                    <div style={{ borderTop: '2px dashed #ccc', paddingTop: '12px' }}>
                        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                            <tbody>
                                {Object.entries({
                                    "نام": slipData.studentName,
                                    "والد": slipData.fatherName,
                                    "درجہ": slipData.grade,
                                    "تاریخ": slipData.date,
                                    "انٹری ٹیسٹ": slipData.testDate,
                                    "نتیجہ": slipData.resultDate,
                                    [slipData.idType === 'passport' ? "پاسپورٹ نمبر" : slipData.idType === 'bform' ? "بی فارم نمبر" : "شناختی کارڈ"]: 
                                        slipData.idType === 'passport' ? slipData.passportNumber : slipData.idType === 'bform' ? slipData.bformNumber : slipData.cnic,
                                    "رابطہ": slipData.contact,
                                    "تعلیمی حیثیت": slipData.category,
                                    "عمر": slipData.age ? `${slipData.age} سال` : undefined,
                                }).map(([label, value]) => value ? (
                                    <tr key={label} style={{ borderBottom: '1px dotted #ddd' }}>
                                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{label}:</td>
                                        <td style={{ padding: '8px 4px', textAlign: 'left' }}>{value}</td>
                                    </tr>
                                ) : null)}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '2px solid black', paddingTop: '12px', marginTop: '12px' }}>
                        <p style={{ fontSize: '12px', margin: 0 }}>{(() => {
                            try {
                                return new Date().toLocaleString('ur-PK');
                            } catch (e) {
                                return new Date().toString();
                            }
                        })()}</p>
                        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0' }}>جزاک اللہ خیراً</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
