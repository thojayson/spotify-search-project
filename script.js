// Initialize Spotify Player with explicit volume control
function initializeSpotifyPlayer() {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    document.body.appendChild(script);

    script.onload = () => {
        window.onSpotifyWebPlaybackSDKReady = () => {
            player = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: (cb) => { cb(accessToken); },
                volume: 0.5 // Set the volume to 50% initially
            });

            // Error handling
            player.addListener("initialization_error", ({ message }) => { console.error("Initialization Error: ", message); });
            player.addListener("authentication_error", ({ message }) => { console.error("Authentication Error: ", message); });
            player.addListener("account_error", ({ message }) => { console.error("Account Error: ", message); });
            player.addListener("playback_error", ({ message }) => { console.error("Playback Error: ", message); });

            // Playback state changes
            player.addListener("player_state_changed", (state) => {
                if (!state) return;
                console.log("Player State Changed: ", state);
            });

            // Ready to play
            player.addListener("ready", ({ device_id }) => {
                console.log("Player is ready with device ID", device_id);
            });

            // Volume check
            player.addListener("volume_changed", (volume) => {
                console.log("Volume changed to: ", volume);
            });

            // Check if the player is connected
            player.addListener("ready", ({ device_id }) => {
                console.log("Player connected with device ID: ", device_id);
            });

            // Connect to the player
            player.connect().then((success) => {
                if (success) {
                    console.log("Player connected successfully!");
                } else {
                    console.log("Failed to connect to the player.");
                }
            });
        };
    };
}
