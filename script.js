// Replace these with your actual Spotify app credentials
const clientID = '91786cabf39742208a39728600d93595';
const clientSecret = 'ba8b994793d54ebd9a02e8fe2271accb';
const redirectUri = 'https://thojayson.github.io/spotify-search-project/';
let accessToken = null;

// Spotify login function
function loginSpotify() {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user-library-read playlist-read-private playlist-read-collaborative streaming user-read-playback-state`;
    window.location.href = authUrl;
}

// Check login status (after successful login and redirection)
function checkLoginStatus() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
        fetchAccessToken(code);
    } else if (accessToken) {
        displayUserInfo();
    } else {
        showLoginButton();
    }
}

// Fetch access token using the authorization code
function fetchAccessToken(code) {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });

    fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(clientID + ':' + clientSecret),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    })
    .then(response => response.json())
    .then(data => {
        accessToken = data.access_token;
        localStorage.setItem('access_token', accessToken);
        window.history.replaceState({}, '', window.location.pathname);
        displayUserInfo();
    })
    .catch(error => {
        console.error('Error fetching access token:', error);
    });
}

// Display user info and login state
function displayUserInfo() {
    const userInfoUrl = 'https://api.spotify.com/v1/me';

    fetch(userInfoUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('login-status').innerHTML = `<p>Welcome, ${data.display_name}</p><button id="logout-btn">Logout</button>`;
        document.getElementById('logout-btn').addEventListener('click', logoutSpotify);
        document.getElementById('login-btn').style.display = 'none';
    })
    .catch(error => {
        console.error('Error fetching user info:', error);
    });
}

// Show the login button if user is not logged in
function showLoginButton() {
    document.getElementById('login-status').innerHTML = '<button id="login-btn">Login with Spotify</button>';
    document.getElementById('login-btn').addEventListener('click', loginSpotify);
}

// Logout from Spotify
function logoutSpotify() {
    localStorage.removeItem('access_token');
    accessToken = null;
    window.location.href = redirectUri; // Redirect back to home page
}

// Search for songs, albums, or artists
function searchSpotify() {
    const searchQuery = document.getElementById('search-input').value;
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,artist,album&limit=10`;

    fetch(searchUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displaySearchResults(data);
    })
    .catch(error => {
        console.error('Error fetching search results:', error);
    });
}

// Display search results on the page
function displaySearchResults(data) {
    const songList = document.getElementById('song-list');
    songList.innerHTML = '';

    if (data.tracks) {
        data.tracks.items.forEach(song => {
            const songElement = document.createElement('div');
            songElement.classList.add('song');
            songElement.innerHTML = `<p>${song.name} by ${song.artists[0].name}</p><a href="${song.external_urls.spotify}" target="_blank">Listen</a>`;
            songList.appendChild(songElement);
        });
    }
}

// Set up event listeners for search button
document.getElementById('search-btn').addEventListener('click', searchSpotify);

// Initialize the page
function init() {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
        accessToken = storedToken;
        displayUserInfo();
    } else {
        checkLoginStatus();
    }
}

// Run initialization
init();
