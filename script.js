<meta name='viewport' content='width=device-width, initial-scale=1'/><script>// ==================== FULL JAVASCRIPT FILE (script.js) ====================
// ==================== ACCOUNT SYSTEM WITH SUPABASE ====================

// ---------- 1. DOM Elements ----------
const accountModal = document.getElementById('accountModal');
const profileCircle = document.getElementById('profileCircle');
const photoInput = document.getElementById('photoInput');
const profileImage = document.getElementById('profileImage');
const accountName = document.getElementById('accountName');
const registerBtn = document.getElementById('registerBtn');

let currentPhotoBase64 = '';

// Default Profile (SVG)
const DEFAULT_PROFILE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234a5568'/%3E%3Ccircle cx='50' cy='35' r='15' fill='%23e2e8f0'/%3E%3Ccircle cx='35' cy='32' r='2' fill='%23334155'/%3E%3Ccircle cx='65' cy='32' r='2' fill='%23334155'/%3E%3Cpath d='M35 55 Q50 70 65 55' stroke='%23e2e8f0' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";

// ---------- 2. Helper Functions ----------
// User ID (10 လုံး - ဂဏန်းသက်သက်)
function generateUserId() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Invite Code (8 လုံး - A-Z, 0-9)
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Loading State
function showLoading() {
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>ဖွင့်နေသည်...</span>';
    }
}

function hideLoading() {
    if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>အကောင့်ဖွင့်မည်</span>';
    }
}

// ---------- 3. Profile Photo Upload ----------
if (profileCircle) {
    profileCircle.addEventListener('click', () => {
        if (photoInput) photoInput.click();
    });
}

if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentPhotoBase64 = event.target.result;
                if (profileImage) profileImage.src = currentPhotoBase64;
            };
            reader.readAsDataURL(file);
        }
    });
}

// ---------- 4. SUPABASE CONFIGURATION ----------
const SERVERS = [
    { 
        url: 'https://zwhynykeurcjhjgirihi.supabase.co', 
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3aHlueWtldXJjamhqZ2lyaWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTY5OTIsImV4cCI6MjA4OTU3Mjk5Mn0.-EWhUNgaJb_0VwByjns_lgsVmwk9GTF4c34TlYLdFP8', 
        name: 'Server 1', 
        maxUsers: 100 
    },
    { 
        url: 'https://dufijmbcqnjlseffcwae.supabase.co', 
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmlqbWJjcW5qbHNlZmZjd2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTcxMTAsImV4cCI6MjA4OTU3MzExMH0.qtoBPZodQ5hVj4grHBVbapMHZMO97KpyeeOUgg7836k', 
        name: 'Server 2', 
        maxUsers: 100 
    }
];

// User အနည်းဆုံးရှိတဲ့ Server ကိုရွေး (ပြည့်နေရင် မရွေး)
async function getBestServer() {
    let bestServer = null;
    let lowestCount = Infinity;
    
    for (let server of SERVERS) {
        try {
            const client = supabase.createClient(server.url, server.key);
            const { count, error } = await client
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`${server.name} error:`, error);
                continue;
            }
            
            const userCount = count || 0;
            console.log(`${server.name}: ${userCount}/${server.maxUsers} users`);
            
            // နေရာလွတ်ရှိမှ ရွေး
            if (userCount < server.maxUsers && userCount < lowestCount) {
                lowestCount = userCount;
                bestServer = { ...server, client };
            }
        } catch(e) {
            console.log(`${server.name} error:`, e);
        }
    }
    
    return bestServer;
}

// Supabase မှာသိမ်း
async function saveToSupabase(userData, server) {
    try {
        const { error } = await server.client
            .from('users')
            .insert([userData]);
        
        if (error) {
            console.error("Insert error:", error);
            return false;
        }
        
        console.log(`✅ Saved to ${server.name}`);
        return true;
    } catch(e) {
        console.error("Save error:", e);
        return false;
    }
}

// ---------- 5. MAIN REGISTER FUNCTION ----------
async function registerAccount() {
    // Check if Supabase is available
    if (typeof supabase === 'undefined') {
        alert("Supabase library မပါပါ။ အင်တာနက်ချိတ်ဆက်မှု စစ်ဆေးပါ။");
        return;
    }
    
    const name = accountName ? accountName.value.trim() : '';
    if (!name) {
        alert("နာမည်ထည့်ပါ။");
        return;
    }
    
    if (name.length < 2) {
        alert("နာမည် အနည်းဆုံး 2 လုံးထည့်ပါ။");
        return;
    }
    
    showLoading();
    
    // Server ရွေး
    const selectedServer = await getBestServer();
    
    if (!selectedServer) {
        hideLoading();
        alert("Server အားလုံးပြည့်နေပါသည်။ နောက်မှကြိုးစားပါ။");
        return;
    }
    
    const userId = generateUserId();
    const inviteCode = generateInviteCode();
    const photo = currentPhotoBase64 || DEFAULT_PROFILE;
    
    const userData = {
        id: userId,
        name: name,
        photo: photo,
        invite_code: inviteCode,
        created_at: new Date().toISOString()
    };
    
    // Supabase မှာသိမ်း
    const saved = await saveToSupabase(userData, selectedServer);
    
    if (saved) {
        // Local Storage မှာသိမ်း
        localStorage.setItem('shrio_user', JSON.stringify(userData));
        localStorage.setItem('shrio_logged_in', 'true');
        localStorage.setItem('shrio_server', selectedServer.name);
        
        hideLoading();
        alert(`အကောင့်ဖွင့်ပြီးပါပြီ။\n\nကြိုဆိုပါသည် ${name}`);
        if (accountModal) accountModal.classList.remove('active');
    } else {
        hideLoading();
        alert("အကောင့်ဖွင့်လို့မရပါ။ နောက်မှကြိုးစားပါ။");
    }
}

// ---------- 6. EVENT LISTENERS ----------
if (registerBtn) {
    registerBtn.addEventListener('click', registerAccount);
}

if (accountName) {
    accountName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') registerAccount();
    });
}

// ---------- 7. CHECK LOGIN STATUS ON PAGE LOAD ----------
window.addEventListener('load', () => {
    const user = localStorage.getItem('shrio_user');
    const loggedIn = localStorage.getItem('shrio_logged_in');
    
    if (!user || loggedIn !== 'true') {
        // အကောင့်မရှိရင် modal ပြမယ်
        setTimeout(() => {
            if (accountModal) accountModal.classList.add('active');
        }, 500);
    } else {
        // အကောင့်ရှိရင် modal ဖျောက်မယ်
        if (accountModal) accountModal.classList.remove('active');
        // Load user data to profile
        try {
            const userData = JSON.parse(user);
            if (userData.photo && profileImage) profileImage.src = userData.photo;
            if (userData.name && accountName) accountName.value = userData.name;
        } catch(e) {}
    }
});

// ---------- 8. EXPORT FUNCTIONS (for external use) ----------
window.AccountSystem = {
    getUser: () => {
        const user = localStorage.getItem('shrio_user');
        return user ? JSON.parse(user) : null;
    },
    isLoggedIn: () => {
        return localStorage.getItem('shrio_logged_in') === 'true';
    },
    logout: () => {
        localStorage.removeItem('shrio_user');
        localStorage.removeItem('shrio_logged_in');
        localStorage.removeItem('shrio_server');
        if (accountModal) accountModal.classList.add('active');
    }
};

console.log('✅ Account System with Supabase is ready!');
// DOM Elements
const searchIcon = document.getElementById('searchIcon');
const searchBarContainer = document.getElementById('searchBarContainer');
const closeSearchBar = document.getElementById('closeSearchBar');
const searchInput = document.getElementById('searchInput');
const homeScreen = document.getElementById('homeScreen');
const detailScreen = document.getElementById('detailScreen');
const detailContainer = document.getElementById('detailContainer');

// Get all anime cards and play buttons
const animeCards = document.querySelectorAll('.anime-card');
const playButtons = document.querySelectorAll('.play-button');

// ==================== ANIME EPISODE CONFIGURATION ====================
// Anime ID အလိုက် Episode Video Links နှင့် Episode အမည်များ
// ဒီမှာ ထည့်သွင်းပါ
const ANIME_EPISODES = {
    // Could Real Life Be Like a Dream? (ID = 1)
    1: {
        episodes: {
            1: {
                name: "အစပြုခြင်း",
                videoUrl: "https://api.telegram.org/file/bot8703247201:AAFGQ72N7xNnV3cLLxnR7pP_lFSEzeVsNqs/videos/file_2.mp4"
            },
            2: {
                name: "အိပ်မက်လား ဖြစ်ရပ်မှန်လား",
                videoUrl: ""
            },
            3: {
                name: "တွေ့ဆုံခြင်း",
                videoUrl: ""
            },
            4: {
                name: "ခရီးစဉ်",
                videoUrl: ""
            },
            5: {
                name: "အမှတ်တရ",
                videoUrl: ""
            },
            6: {
                name: "ပြောင်းလဲမှု",
                videoUrl: ""
            },
            7: {
                name: "ဆုံးဖြတ်ချက်",
                videoUrl: ""
            },
            8: {
                name: "အတိတ်နှင့်အနာဂတ်",
                videoUrl: ""
            },
            9: {
                name: "နှလုံးသားစကား",
                videoUrl: ""
            },
            10: {
                name: "အဆုံးသတ်",
                videoUrl: ""
            },
            11: {
                name: "နောက်ဆက်တွဲ",
                videoUrl: ""
            },
            12: {
                name: "နိဂုံး",
                videoUrl: ""
            }
        }
    },
    // Jujutsu Kaisen (ID = 2)
    2: {
        episodes: {
            1: {
                name: "Ryomen Sukuna",
                videoUrl: ""
            },
            2: {
                name: "ငါ့အတွက် သေတတ်တဲ့သူ",
                videoUrl: ""
            },
            3: {
                name: "ဂျူဂျွတ်စ် အထက်တန်းကျောင်း",
                videoUrl: ""
            },
            4: {
                name: "အမှောင်ထုထဲက ကြောက်မက်ဖွယ်",
                videoUrl: ""
            },
            5: {
                name: "မိသားစု",
                videoUrl: ""
            },
            6: {
                name: "နွေဦးရာသီ",
                videoUrl: ""
            },
            7: {
                name: "တိုကျိုမြို့အရှေ့ပိုင်း",
                videoUrl: ""
            },
            8: {
                name: "အိပ်ငိုက်ခြင်း",
                videoUrl: ""
            },
            9: {
                name: "သေးငယ်တဲ့အရာ",
                videoUrl: ""
            },
            10: {
                name: "ပြန်လည်ဆုံဆည်းခြင်း",
                videoUrl: ""
            },
            11: {
                name: "အမိုက်စား",
                videoUrl: ""
            },
            12: {
                name: "သူငယ်ချင်းများ",
                videoUrl: ""
            }
        }
    },
    // One Piece (ID = 3)
    3: {
        episodes: {
            1: {
                name: "ငါဟာ လူပင်လယ်ဘုရင်ဖြစ်မယ်",
                videoUrl: ""
            },
            2: {
                name: "ဓားသမား Roronoa Zoro",
                videoUrl: ""
            },
            3: {
                name: "Morgan နှင့် Helmeppo",
                videoUrl: ""
            },
            4: {
                name: "Luffy ရဲ့ အတိတ်",
                videoUrl: ""
            },
            5: {
                name: "ပင်လယ်ဓားပြတို့ရဲ့ ဂုဏ်သိက္ခာ",
                videoUrl: ""
            },
            6: {
                name: "ပထမဆုံးသင်္ဘော",
                videoUrl: ""
            },
            7: {
                name: "ဟင်းချက် Sanji",
                videoUrl: ""
            },
            8: {
                name: "Baratie စစ်ဆင်ရေး",
                videoUrl: ""
            },
            9: {
                name: "အပြာရောင်အစာ",
                videoUrl: ""
            },
            10: {
                name: "Arlong Park စတင်ခြင်း",
                videoUrl: ""
            },
            11: {
                name: "Nami ရဲ့ အတိတ်",
                videoUrl: ""
            },
            12: {
                name: "လွတ်လပ်မှုအတွက် တိုက်ပွဲ",
                videoUrl: ""
            }
        }
    },
    // Attack on Titan (ID = 4)
    4: {
        episodes: {
            1: {
                name: "၂၀၀၀ နှစ်အကြာ မင်းဆီသို့",
                videoUrl: ""
            },
            2: {
                name: "ထိုနေ့",
                videoUrl: ""
            },
            3: {
                name: "မျက်ရည်စက်များ",
                videoUrl: ""
            },
            4: {
                name: "ပထမဆုံးတိုက်ပွဲ",
                videoUrl: ""
            },
            5: {
                name: "သက်သေပြခြင်း",
                videoUrl: ""
            },
            6: {
                name: "မိန်းကလေးမြို့",
                videoUrl: ""
            },
            7: {
                name: "သေးငယ်တဲ့ဓားသွား",
                videoUrl: ""
            },
            8: {
                name: "နှလုံးသားတွေရဲ့ရိုက်ခတ်သံ",
                videoUrl: ""
            },
            9: {
                name: "ဘယ်ဘက်လက်မောင်း နေရာ",
                videoUrl: ""
            },
            10: {
                name: "တုံ့ပြန်မှု",
                videoUrl: ""
            },
            11: {
                name: "မိုက်မဲသော ဧရာမ",
                videoUrl: ""
            },
            12: {
                name: "ဒဏ်ရာ",
                videoUrl: ""
            }
        }
    },
    // Naruto (ID = 5)
    5: {
        episodes: {
            1: {
                name: "နာရူတိုး မွေးဖွားခြင်း",
                videoUrl: ""
            },
            2: {
                name: "ကိုနိုဟာမုဒ်",
                videoUrl: ""
            },
            3: {
                name: "Sasuke နှင့် Sakura",
                videoUrl: ""
            },
            4: {
                name: "ခေါင်းဆောင်စမ်းသပ်မှု",
                videoUrl: ""
            },
            5: {
                name: "Zabuza စတင်ခြင်း",
                videoUrl: ""
            },
            6: {
                name: "မြူခိုးထဲက လူသတ်သမား",
                videoUrl: ""
            },
            7: {
                name: "Haku ရဲ့ ဆုံးဖြတ်ချက်",
                videoUrl: ""
            },
            8: {
                name: "နာရူတိုး ရဲ့ တိုးတက်မှု",
                videoUrl: ""
            },
            9: {
                name: "ချူနင်စာမေးပွဲ",
                videoUrl: ""
            },
            10: {
                name: "Rock Lee vs Gaara",
                videoUrl: ""
            },
            11: {
                name: "Orochimaru ရဲ့ ခြိမ်းခြောက်မှု",
                videoUrl: ""
            },
            12: {
                name: "သစ်ရွက်တွေ ကြွေကျချိန်",
                videoUrl: ""
            }
        }
    },
    // Dragon Ball Z (ID = 6)
    6: {
        episodes: {
            1: {
                name: "ရေဒစ် ရောက်ရှိလာခြင်း",
                videoUrl: ""
            },
            2: {
                name: "ဂိုဟန်ရဲ့ အစွမ်း",
                videoUrl: ""
            },
            3: {
                name: "ဂိုကူ သေဆုံးခြင်း",
                videoUrl: ""
            },
            4: {
                name: "ဘယ်ဂီတာ ရောက်ရှိလာခြင်း",
                videoUrl: ""
            },
            5: {
                name: "နေပါလမ် ဖျက်ဆီးခံရခြင်း",
                videoUrl: ""
            },
            6: {
                name: "ကိုင်းအိုကင်း ရဲ့ လေ့ကျင့်မှု",
                videoUrl: ""
            },
            7: {
                name: "ဖရီဇာ ရဲ့ ခြိမ်းခြောက်မှု",
                videoUrl: ""
            },
            8: {
                name: "စူပါဆိုင်ယန်",
                videoUrl: ""
            },
            9: {
                name: "ဆဲလ် ဂိမ်း",
                videoUrl: ""
            },
            10: {
                name: "ဂိုဟန် vs ဆဲလ်",
                videoUrl: ""
            },
            11: {
                name: "မျှော်လင့်ချက်",
                videoUrl: ""
            },
            12: {
                name: "ငြိမ်းချမ်းရေး",
                videoUrl: ""
            }
        }
    },
    // My Hero Academia (ID = 7)
    7: {
        episodes: {
            1: {
                name: "Izuku Midoriya: အစပြုခြင်း",
                videoUrl: ""
            },
            2: {
                name: "All Might ရဲ့ အမွေ",
                videoUrl: ""
            },
            3: {
                name: "UA အထက်တန်းကျောင်း",
                videoUrl: ""
            },
            4: {
                name: "ဗီလိန် သင်္ချိုင်း",
                videoUrl: ""
            },
            5: {
                name: "ဘာကူဂိုး ရဲ့ ဒေါသ",
                videoUrl: ""
            },
            6: {
                name: "အားလုံးအတွက် သူရဲကောင်း",
                videoUrl: ""
            },
            7: {
                name: "တိုဒိုရိုကီ ရဲ့ အတိတ်",
                videoUrl: ""
            },
            8: {
                name: "အားကစားပွဲတော်",
                videoUrl: ""
            },
            9: {
                name: "ဗီလိန် အဖွဲ့အစည်း",
                videoUrl: ""
            },
            10: {
                name: "ကယ်ဆယ်ရေး လေ့ကျင့်မှု",
                videoUrl: ""
            },
            11: {
                name: "ဒဏ်ရာရပြီးနောက်",
                videoUrl: ""
            },
            12: {
                name: "နောက်ဆုံးတိုက်ပွဲ",
                videoUrl: ""
            }
        }
    },
    // Tokyo Revengers (ID = 8)
    8: {
        episodes: {
            1: {
                name: "မကြာမှီလာမည်",
                videoUrl: ""
            },
            2: {
                name: "တိုမန် ဂိုဏ်း",
                videoUrl: ""
            },
            3: {
                name: "Mikey ရဲ့ အတိတ်",
                videoUrl: ""
            },
            4: {
                name: "Draken ရဲ့ သစ္စာ",
                videoUrl: ""
            },
            5: {
                name: "ဂိုဏ်းစစ်ပွဲ",
                videoUrl: ""
            },
            6: {
                name: "ကယ်ဆယ်ရေး",
                videoUrl: ""
            },
            7: {
                name: "ပြောင်းလဲသွားတဲ့ အနာဂတ်",
                videoUrl: ""
            },
            8: {
                name: "တာချီဘနာ ရဲ့ သေဆုံးခြင်း",
                videoUrl: ""
            },
            9: {
                name: "လက်စားချေခြင်း",
                videoUrl: ""
            },
            10: {
                name: "အချိန်ခရီးသွား",
                videoUrl: ""
            },
            11: {
                name: "နောက်ဆုံးအကြိမ်",
                videoUrl: ""
            },
            12: {
                name: "အနာဂတ်ကို ပြောင်းလဲခြင်း",
                videoUrl: ""
            }
        }
    }
};

// ==================== SEARCH FUNCTIONS ====================
// Open Search Bar
if (searchIcon) {
    searchIcon.addEventListener('click', (e) => {
        e.preventDefault();
        if (searchBarContainer.classList.contains('active')) {
            searchBarContainer.classList.remove('active');
            searchInput.value = '';
            showAllCards();
        } else {
            searchBarContainer.classList.add('active');
            searchInput.focus();
        }
    });
}

// Close Search Bar
if (closeSearchBar) {
    closeSearchBar.addEventListener('click', () => {
        searchBarContainer.classList.remove('active');
        searchInput.value = '';
        showAllCards();
    });
}

// Search Function - real-time
function searchAnime() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        showAllCards();
        return;
    }
    
    animeCards.forEach(card => {
        const animeName = card.getAttribute('data-name').toLowerCase();
        
        if (animeName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Show All Cards
function showAllCards() {
    animeCards.forEach(card => {
        card.style.display = 'block';
    });
}

// Search on input
if (searchInput) {
    searchInput.addEventListener('input', searchAnime);
}

// ESC key to close search
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchBarContainer.classList.contains('active')) {
        searchBarContainer.classList.remove('active');
        searchInput.value = '';
        showAllCards();
    }
});

// ==================== VIDEO PLAYER MODAL (In-Page Overlay) ====================
// Create video player modal - Video in its own aspect ratio (16:9) centered
const videoModal = document.createElement('div');
videoModal.id = 'videoModal';
videoModal.innerHTML = `
    <div class="video-modal-overlay">
        <div class="video-modal-container">
            <!-- SIMPLE HEADER: Back button + Title only -->
            <div class="video-modal-header">
                <button class="video-modal-back" id="closeVideoModal">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="video-modal-title" id="videoModalTitleMain">Now Playing</div>
            </div>
            <!-- VIDEO with aspect ratio - centered -->
            <div class="video-modal-body">
                <div class="video-wrapper">
                    <video id="modalVideoPlayer" controls autoplay class="video-element">
                        <source src="" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    </div>
`;
document.body.appendChild(videoModal);

// Add video modal styles
const videoModalStyles = document.createElement('style');
videoModalStyles.textContent = `
    /* Video Modal - Simple Design with Aspect Ratio */
    #videoModal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        animation: fadeIn 0.3s ease;
    }
    
    #videoModal.active {
        display: block;
    }
    
    .video-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000000;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .video-modal-container {
        position: relative;
        width: 100%;
        height: 100%;
        background: #000;
        display: flex;
        flex-direction: column;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    /* SIMPLE HEADER - Back button + Title only */
    .video-modal-header {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
        z-index: 10;
        pointer-events: none;
    }
    
    .video-modal-back {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
        backdrop-filter: blur(10px);
        pointer-events: auto;
    }
    
    .video-modal-back:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }
    
    .video-modal-back:active {
        transform: scale(0.95);
    }
    
    .video-modal-back i {
        font-size: 1.3rem;
    }
    
    .video-modal-title {
        font-weight: 600;
        font-size: 1.1rem;
        color: white;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        pointer-events: auto;
    }
    
    /* VIDEO BODY - centers the video with its aspect ratio */
    .video-modal-body {
        flex: 1;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }
    
    /* Video wrapper - maintains aspect ratio and centers */
    .video-wrapper {
        position: relative;
        width: 100%;
        max-width: 100%;
        background: #000;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    
    /* Video element - maintains its own aspect ratio */
    .video-element {
        width: 100%;
        height: auto;
        max-height: 100vh;
        object-fit: contain;
        background: #000;
        display: block;
    }
    
    /* Remove default video controls styling issues */
    video::-webkit-media-controls-panel {
        background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
        .video-modal-header {
            padding: 12px 16px;
            gap: 12px;
        }
        
        .video-modal-back {
            width: 38px;
            height: 38px;
        }
        
        .video-modal-back i {
            font-size: 1.1rem;
        }
        
        .video-modal-title {
            font-size: 0.95rem;
        }
    }
    
    @media (max-width: 480px) {
        .video-modal-header {
            padding: 10px 12px;
            gap: 10px;
        }
        
        .video-modal-back {
            width: 34px;
            height: 34px;
        }
        
        .video-modal-title {
            font-size: 0.85rem;
        }
    }
    
    /* Landscape mode - video still maintains aspect ratio */
    @media (orientation: landscape) {
        .video-modal-header {
            padding: 10px 16px;
        }
        
        .video-modal-back {
            width: 36px;
            height: 36px;
        }
        
        .video-element {
            width: auto;
            height: 100%;
            max-width: 100%;
        }
        
        .video-wrapper {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
`;
document.head.appendChild(videoModalStyles);

// Video modal elements
const modalVideoPlayer = document.getElementById('modalVideoPlayer');
const closeVideoModal = document.getElementById('closeVideoModal');
const videoModalTitleMain = document.getElementById('videoModalTitleMain');

// Function to open video modal
function openVideoModal(videoUrl, animeName, episodeNum, episodeName) {
    if (!videoUrl || videoUrl === "") {
        alert(`⚠️ Episode ${episodeNum} "${episodeName}" သည်မထွက်ရှိသေးပါ။`);
        return false;
    }
    
    // Set video source
    modalVideoPlayer.src = videoUrl;
    modalVideoPlayer.load();
    
    // Update title only - simple
    videoModalTitleMain.textContent = `${animeName} • ${episodeNum}. ${episodeName}`;
    
    // Show modal
    videoModal.classList.add('active');
    
    return true;
}

// Close video modal
function closeVideoModalFunc() {
    if (modalVideoPlayer) {
        modalVideoPlayer.pause();
        modalVideoPlayer.src = '';
        modalVideoPlayer.load();
    }
    videoModal.classList.remove('active');
}

// Close modal events
if (closeVideoModal) {
    closeVideoModal.addEventListener('click', closeVideoModalFunc);
}

// Close when clicking on overlay background
const modalOverlay = document.querySelector('.video-modal-overlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeVideoModalFunc();
        }
    });
}

// ESC key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal.classList.contains('active')) {
        closeVideoModalFunc();
    }
});

// ==================== HELPER FUNCTIONS ====================
// Function to get status text and icon
function getStatusInfo(status) {
    if (status === 'ongoing') {
        return {
            text: 'ထုတ်လုပ်နေဆဲ',
            icon: 'fa-spinner fa-pulse',
            class: 'ongoing'
        };
    } else if (status === 'completed') {
        return {
            text: 'ထုတ်လုပ်မှုပြီးစီး',
            icon: 'fa-check-circle',
            class: 'completed'
        };
    } else if (status === 'coming_soon') {
        return {
            text: 'မကြာမီလာမည်',
            icon: 'fa-clock',
            class: 'coming-soon'
        };
    } else {
        // default (သတ်မှတ်မထားရင် ongoing အနေနဲ့ပြမယ်)
        return {
            text: 'ထုတ်လုပ်နေဆဲ',
            icon: 'fa-spinner fa-pulse',
            class: 'ongoing'
        };
    }
}

// Function to generate episode list with episode names and video links
function generateEpisodes(animeId, totalEpisodes, animeImage) {
    const episodes = [];
    const maxEpisodes = Math.min(totalEpisodes, 12);
    const animeData = ANIME_EPISODES[animeId];
    
    for (let i = 1; i <= maxEpisodes; i++) {
        let episodeName = `Episode ${i}`;
        let videoUrl = "";
        
        if (animeData && animeData.episodes && animeData.episodes[i]) {
            episodeName = animeData.episodes[i].name;
            videoUrl = animeData.episodes[i].videoUrl;
        }
        
        episodes.push({
            number: i,
            name: episodeName,
            image: animeImage,
            videoUrl: videoUrl
        });
    }
    
    return episodes;
}

// ==================== DETAIL SCREEN FUNCTIONS ====================
// Function to show detail screen
function showDetailScreen(animeId) {
    const selectedCard = document.querySelector(`.anime-card[data-id="${animeId}"]`);
    if (!selectedCard) return;
    
    const name = selectedCard.getAttribute('data-name');
    const nameMm = selectedCard.getAttribute('data-namemm');
    const image = selectedCard.getAttribute('data-image');
    const banner = selectedCard.getAttribute('data-banner');
    const genresStr = selectedCard.getAttribute('data-genres');
    const likes = parseInt(selectedCard.getAttribute('data-likes')) || 0;
    const episodes = parseInt(selectedCard.getAttribute('data-episodes')) || 12;
    const status = selectedCard.getAttribute('data-status');
    const telegramLink = selectedCard.getAttribute('data-telegram');
    
    let genres = [];
    try {
        genres = JSON.parse(genresStr);
    } catch(e) {
        genres = ['Action', 'Adventure'];
    }
    
    const statusInfo = getStatusInfo(status);
    const episodeList = generateEpisodes(parseInt(animeId), episodes, image);
    const animeName = name;
    
    const detailHTML = `
        <div class="detail-banner" style="background-image: url('${banner}')">
            <div class="detail-banner-overlay"></div>
        </div>
        <div class="back-button" id="backButton">
            <i class="fas fa-arrow-left"></i>
        </div>
        <div class="detail-content">
            <div class="detail-info-row">
                <div class="detail-small-image">
                    <img src="${image}" alt="${name}">
                </div>
                <div class="detail-name-section">
                    <div class="detail-anime-name">${name}</div>
                    <div class="detail-anime-name-mm">${nameMm}</div>
                    <div class="detail-genres">
                        ${genres.map(g => `<span class="detail-genre-tag">${g}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="like-status-row">
                <div class="like-button" id="likeButton" data-likes="${likes}">
                    <i class="far fa-heart"></i>
                    <span class="like-count">${likes.toLocaleString()}</span>
                </div>
                <div class="status-badge ${statusInfo.class}">
                    <i class="fas ${statusInfo.icon}"></i>
                    <span>${statusInfo.text}</span>
                </div>
            </div>
            
            <a href="${telegramLink}" class="telegram-button" target="_blank">
                <i class="fab fa-telegram-plane"></i>
                <span>ထုတ်လုပ်သည် Channel</span>
                <i class="fas fa-external-link-alt" style="font-size: 0.8rem;"></i>
            </a>
            
            <div class="episode-section-title">
                <i class="fas fa-list"></i>
                <span>Episodes (${episodeList.length})</span>
            </div>
            
            <div class="episode-list" id="episodeList">
                ${episodeList.map(ep => `
                    <div class="episode-item" data-video-url="${ep.videoUrl}" data-ep-num="${ep.number}" data-ep-name="${ep.name}">
                        <div class="episode-image">
                            <img src="${ep.image}" alt="${ep.name}">
                        </div>
                        <div class="episode-info">
                            <div class="episode-number">EP ${ep.number}</div>
                            <div class="episode-title">${ep.name}</div>
                        </div>
                        <div class="episode-play" data-episode="${ep.number}">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    detailContainer.innerHTML = detailHTML;
    
    homeScreen.classList.remove('active');
    detailScreen.classList.add('active');
    
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', () => {
            detailScreen.classList.remove('active');
            homeScreen.classList.add('active');
        });
    }
    
    const likeButton = document.getElementById('likeButton');
if (likeButton) {
    let currentLikes = likes;
    const likeCountSpan = likeButton.querySelector('.like-count');
    const likeIcon = likeButton.querySelector('i');
    
    // Get current user ID
    const userId = localStorage.getItem('shrio_user_id');
    const animeIdForLike = animeId;  // animeId is available from outer scope
    
    // Check if user already liked this anime
    const likedKey = `liked_anime_${animeIdForLike}_${userId}`;
    let isLiked = localStorage.getItem(likedKey) === 'true';
    
    // Set initial heart icon state
    if (isLiked) {
        likeIcon.className = 'fas fa-heart';
    } else {
        likeIcon.className = 'far fa-heart';
    }
    
    likeButton.addEventListener('click', async () => {
        // Get user data for Telegram notification
        const userData = getCurrentUserData();
        const userName = userData ? userData.name : 'အမည်မရှိသေး';
        const userIdForNotif = userData ? userData.id : 'ID မရှိသေး';
        const serverNo = SERVER_NO;
        
        if (isLiked) {
            // UNLIKE - Remove like (decrease number)
            currentLikes--;
            likeIcon.className = 'far fa-heart';
            isLiked = false;
            
            // Remove from localStorage
            localStorage.removeItem(likedKey);
            
            // Send unlike notification to Telegram
            await sendUnlikeNotification(name, userName, userIdForNotif, serverNo);
            
        } else {
            // LIKE - Add like (increase number)
            currentLikes++;
            likeIcon.className = 'fas fa-heart';
            isLiked = true;
            
            // Save to localStorage
            localStorage.setItem(likedKey, 'true');
            
            // Send like notification to Telegram
            await sendLikeNotification(name, userName, userIdForNotif, serverNo);
        }
        
        // Update like count display (number changes)
        likeCountSpan.textContent = currentLikes.toLocaleString();
        
        // Update card data in home screen
        if (selectedCard) {
            selectedCard.setAttribute('data-likes', currentLikes);
        }
        
        // Also update the like count on the home screen card
        const homeCard = document.querySelector(`.anime-card[data-id="${animeIdForLike}"]`);
        if (homeCard) {
            homeCard.setAttribute('data-likes', currentLikes);
        }
    });
}
    
    // Episode play buttons - Open video modal in the middle
    const episodePlayButtons = document.querySelectorAll('.episode-play');
    episodePlayButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const episodeItem = btn.closest('.episode-item');
            const videoUrl = episodeItem ? episodeItem.getAttribute('data-video-url') : '';
            const episodeNum = btn.getAttribute('data-episode');
            const episodeName = episodeItem ? episodeItem.getAttribute('data-ep-name') : `Episode ${episodeNum}`;
            openVideoModal(videoUrl, animeName, episodeNum, episodeName);
        });
    });
    
    const episodeItems = document.querySelectorAll('.episode-item');
    episodeItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.episode-play')) return;
            const videoUrl = item.getAttribute('data-video-url');
            const episodeNum = item.getAttribute('data-ep-num');
            const episodeName = item.getAttribute('data-ep-name');
            openVideoModal(videoUrl, animeName, episodeNum, episodeName);
        });
    });
}

// ==================== EVENT LISTENERS ====================
playButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        const animeId = button.getAttribute('data-id');
        showDetailScreen(animeId);
    });
});

animeCards.forEach(card => {
    card.addEventListener('click', () => {
        const animeId = card.getAttribute('data-id');
        showDetailScreen(animeId);
    });
});

const homeNavItem = document.querySelector('.nav-item:first-child');
if (homeNavItem) {
    homeNavItem.addEventListener('click', (e) => {
        e.preventDefault();
        if (videoModal.classList.contains('active')) {
            closeVideoModalFunc();
        } else if (detailScreen.classList.contains('active')) {
            detailScreen.classList.remove('active');
            homeScreen.classList.add('active');
        }
    });
}

const navItems = document.querySelectorAll('.nav-item');
if (navItems.length > 1) {
    navItems.forEach((item, index) => {
        if (index !== 0) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Alert ဖြတ်ပြီး ဘာမှမလုပ်တော့ဘူး
                // const text = item.querySelector('.text')?.innerText || '';
                // alert(`${text} လုပ်ဆောင်ချက် ထပ်မံထည့်သွင်းပေးပါမည်။`);
            });
        }
    });
}

console.log('ShrioPlay - Video Modal Ready (Header above video, not inside)');

// ==================== PROFILE SCREEN (အလယ်မှာပြမယ်) ====================
(function() {
    console.log('🔄 Loading Profile Screen...');
    
    const profileScreen = document.getElementById('profileScreen');
    const homeScreen = document.getElementById('homeScreen');
    const detailScreen = document.getElementById('detailScreen');
    const profileBackBtn = document.getElementById('profileBackBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editProfileCircle = document.getElementById('editProfileCircle');
    const editPhotoInput = document.getElementById('editPhotoInput');
    const editName = document.getElementById('editName');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const profileImageLarge = document.getElementById('profileImageLarge');
    const profileName = document.getElementById('profileName');
    const profileId = document.getElementById('profileId');
    const profileInvite = document.getElementById('profileInvite');
    const editProfileImage = document.getElementById('editProfileImage');

    let currentUserData = null;
    const DEFAULT_PROFILE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234a5568'/%3E%3Ccircle cx='50' cy='35' r='15' fill='%23e2e8f0'/%3E%3Ccircle cx='35' cy='32' r='2' fill='%23334155'/%3E%3Ccircle cx='65' cy='32' r='2' fill='%23334155'/%3E%3Cpath d='M35 55 Q50 70 65 55' stroke='%23e2e8f0' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E";

    function loadProfileData() {
        const userStr = localStorage.getItem('shrio_user');
        if (userStr) {
            try {
                currentUserData = JSON.parse(userStr);
                if (profileImageLarge) profileImageLarge.src = currentUserData.photo || DEFAULT_PROFILE;
                if (profileName) profileName.textContent = currentUserData.name || 'အမည်မရှိသေး';
                if (profileId) profileId.textContent = currentUserData.id || 'ID မရှိသေး';
                if (profileInvite) profileInvite.textContent = currentUserData.invite_code || 'CODE မရှိသေး';
            } catch(e) { console.error(e); }
        }
    }

    function showProfileScreen() {
        const loggedIn = localStorage.getItem('shrio_logged_in') === 'true';
        if (!loggedIn) {
            const accountModal = document.getElementById('accountModal');
            if (accountModal) accountModal.classList.add('active');
            return;
        }
        loadProfileData();
        if (homeScreen) homeScreen.classList.remove('active');
        if (detailScreen) detailScreen.classList.remove('active');
        if (profileScreen) profileScreen.classList.add('active');
    }

    function hideProfileScreen() {
        if (profileScreen) profileScreen.classList.remove('active');
        if (homeScreen) homeScreen.classList.add('active');
    }

    // Back Button - နှိပ်ရင် Home ကိုပြန်သွားမယ်
    if (profileBackBtn) {
        profileBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideProfileScreen();
        });
    }

    // Click outside to close (ကတ်အပြင်ကိုနှိပ်ရင် ပိတ်မယ်)
    if (profileScreen) {
        profileScreen.addEventListener('click', (e) => {
            if (e.target === profileScreen) {
                hideProfileScreen();
            }
        });
    }

    // အောက်ခြေ Account ခလုပ်
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    bottomNavItems.forEach((item) => {
        const textSpan = item.querySelector('.text');
        const btnText = textSpan ? textSpan.innerText : '';
        
        if (btnText === 'Home') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                hideProfileScreen();
                if (detailScreen) detailScreen.classList.remove('active');
            });
        } 
        else if (btnText === 'Account' || btnText === 'Profile') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                showProfileScreen();
            });
        }

        
    });

    // Edit Profile Modal
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            if (currentUserData) {
                editName.value = currentUserData.name || '';
                editProfileImage.src = currentUserData.photo || DEFAULT_PROFILE;
                editModal.classList.add('active');
            } else {
                alert('User data not found. Please register first.');
            }
        });
    }

    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => editModal.classList.remove('active'));
    }

    if (editProfileCircle) {
        editProfileCircle.addEventListener('click', () => editPhotoInput.click());
    }

    if (editPhotoInput) {
        editPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => editProfileImage.src = event.target.result;
                reader.readAsDataURL(file);
            }
        });
    }

    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', () => {
            const newName = editName.value.trim();
            if (!newName) { alert("နာမည် ထည့်ပါ။"); return; }
            if (newName.length < 2) { alert("နာမည် အနည်းဆုံး 2 လုံးထည့်ပါ။"); return; }
            
            if (currentUserData) {
                currentUserData.name = newName;
                currentUserData.photo = editProfileImage.src;
                localStorage.setItem('shrio_user', JSON.stringify(currentUserData));
                loadProfileData();
                
                const profileImageSmall = document.getElementById('profileImage');
                if (profileImageSmall) profileImageSmall.src = editProfileImage.src;
                const accountNameInput = document.getElementById('accountName');
                if (accountNameInput) accountNameInput.value = newName;
                
                editModal.classList.remove('active');
                alert("Profile ပြောင်းလဲမှု အောင်မြင်ပါသည်။");
            }
        });
    }

    loadProfileData();
    console.log('✅ Profile Screen Ready (Centered)');
})();

// ==================== TELEGRAM LIKE/UNLIKE NOTIFICATION ====================
// Telegram Bot Configuration
const BOT_TOKEN = '8094270595:AAERziCUrOYf38DMOSReu1oOSEf2LLG_qS0';
const CHAT_ID = '@shrioplaylike';  // Group username
const SERVER_NO = '1';  // သင့် server နံပါတ် ထည့်ပါ

// Function to send like notification to Telegram
async function sendLikeNotification(animeName, userName, userId, serverNo) {
    const message = `❤️ *LIKE*\n\n` +
                    `📺 *Anime:* ${animeName}\n` +
                    `👤 *User:* ${userName}\n` +
                    `🆔 *ID:* ${userId}\n` +
                    `🖥️ *Server No.:* ${serverNo}\n\n` +
                    `✅ Liked this anime!`;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log('✅ Like notification sent');
    } catch (error) {
        console.error('❌ Error sending like:', error);
    }
}

// Function to send unlike notification to Telegram
async function sendUnlikeNotification(animeName, userName, userId, serverNo) {
    const message = `💔 *UNLIKE*\n\n` +
                    `📺 *Anime:* ${animeName}\n` +
                    `👤 *User:* ${userName}\n` +
                    `🆔 *ID:* ${userId}\n` +
                    `🖥️ *Server No.:* ${serverNo}\n\n` +
                    `❌ Unliked this anime!`;
    
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        console.log('✅ Unlike notification sent');
    } catch (error) {
        console.error('❌ Error sending unlike:', error);
    }
}

// Get current user data from localStorage
function getCurrentUserData() {
    const userStr = localStorage.getItem('shrio_user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch(e) {
            return null;
        }
    }
    return null;
}

// ==================== FAQ SCREEN FUNCTION ====================
(function() {
    // FAQ Screen Elements
    const faqScreen = document.getElementById('faqScreen');
    const homeScreen = document.getElementById('homeScreen');
    const detailScreen = document.getElementById('detailScreen');
    const faqBackBtn = document.getElementById('faqBackBtn');
    
    // Function to show FAQ screen
    function showFaqScreen() {
        if (homeScreen) homeScreen.classList.remove('active');
        if (detailScreen) detailScreen.classList.remove('active');
        if (faqScreen) faqScreen.classList.add('active');
    }
    
    // Function to hide FAQ screen
    function hideFaqScreen() {
        if (faqScreen) faqScreen.classList.remove('active');
        if (homeScreen) homeScreen.classList.add('active');
    }
    
    // Back button event
    if (faqBackBtn) {
        faqBackBtn.addEventListener('click', (e) => {
            e.preventDefault();
            hideFaqScreen();
        });
    }
    
    // Click outside to close (optional)
    if (faqScreen) {
        faqScreen.addEventListener('click', (e) => {
            if (e.target === faqScreen) {
                hideFaqScreen();
            }
        });
    }
    
    // FAQ Accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                // Close other open items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
    
    // Connect to bottom navigation FAQ button
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach((item, index) => {
        const textSpan = item.querySelector('.text');
        const btnText = textSpan ? textSpan.innerText : '';
        
        if (btnText === 'FAQ') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                showFaqScreen();
            });
        }
    });
    
    console.log('✅ FAQ Screen Ready');
})();

// ==================== STUDIO SCREEN FUNCTION ====================
(function() {
    const studioScreen = document.getElementById('studioScreen');
    const studioAnimeScreen = document.getElementById('studioAnimeScreen');
    const homeScreen = document.getElementById('homeScreen');
    const detailScreen = document.getElementById('detailScreen');
    const studioBackBtn = document.getElementById('studioBackBtn');
    const studioAnimeBackBtn = document.getElementById('studioAnimeBackBtn');
    
    function showStudioScreen() {
        if (homeScreen) homeScreen.classList.remove('active');
        if (detailScreen) detailScreen.classList.remove('active');
        if (studioAnimeScreen) studioAnimeScreen.classList.remove('active');
        if (studioScreen) studioScreen.classList.add('active');
    }
    
    function hideStudioScreen() {
        if (studioScreen) studioScreen.classList.remove('active');
        if (homeScreen) homeScreen.classList.add('active');
    }
    
    function showStudioAnimeScreen(studioCard) {
        const studioName = studioCard.querySelector('.studio-card-name').textContent;
        const studioImage = studioCard.querySelector('.studio-card-image img').src;
        const animeDataDiv = studioCard.querySelector('.studio-anime-data');
        
        if (!animeDataDiv) return;
        
        let animeList = [];
        try {
            const animeListStr = animeDataDiv.getAttribute('data-anime-list');
            animeList = JSON.parse(animeListStr);
        } catch(e) {
            console.error('Error parsing anime list:', e);
            return;
        }
        
        document.getElementById('studioAnimeName').textContent = studioName;
        document.getElementById('studioAvatar').querySelector('img').src = studioImage;
        document.getElementById('studioAnimeCount').textContent = animeList.length + " Anime";
        
        const grid = document.getElementById('studioAnimeGrid');
        grid.innerHTML = animeList.map(anime => `
            <div class="studio-anime-card">
                <div class="studio-anime-card-image">
                    <img src="${anime.image}" alt="${anime.name}">
                </div>
                <div class="studio-anime-card-info">
                    <div class="studio-anime-card-name">${anime.name}</div>
                </div>
            </div>
        `).join('');
        
        if (studioScreen) studioScreen.classList.remove('active');
        if (studioAnimeScreen) studioAnimeScreen.classList.add('active');
    }
    
    function hideStudioAnimeScreen() {
        if (studioAnimeScreen) studioAnimeScreen.classList.remove('active');
        if (studioScreen) studioScreen.classList.add('active');
    }
    
    // Event Listeners
    if (studioBackBtn) studioBackBtn.addEventListener('click', hideStudioScreen);
    if (studioAnimeBackBtn) studioAnimeBackBtn.addEventListener('click', hideStudioAnimeScreen);
    
    // View buttons and card click events
    document.querySelectorAll('.studio-card').forEach(card => {
        const viewBtn = card.querySelector('.studio-view-btn');
        
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showStudioAnimeScreen(card);
            });
        }
        
        card.addEventListener('click', () => {
            showStudioAnimeScreen(card);
        });
    });
    
    // Connect to bottom navigation Studio button
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    navItems.forEach(item => {
        const textSpan = item.querySelector('.text');
        if (textSpan && textSpan.innerText === 'Studio') {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                showStudioScreen();
            });
        }
    });
    
    console.log('✅ Studio Screen Ready (3 columns, 6 studios, data from HTML)');
})();</script>