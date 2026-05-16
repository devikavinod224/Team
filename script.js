class LoginApp {
    constructor() {
        this.usernameInput = document.getElementById('username');
        this.loginBtn = document.getElementById('loginBtn');
        this.profileRing = document.getElementById('profileRing');
        this.profileImage = document.getElementById('profileImage');
        this.toastContainer = document.getElementById('toastContainer');
        this.btnLoader = document.getElementById('btnLoader');
        this.btnText = document.querySelector('.btn-text');
        this.videoToggle = document.getElementById('videoToggle');
        this.bgVideo = document.getElementById('bgVideo');

        this.init();
    }

    init() {
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        this.videoToggle.addEventListener('click', () => this.toggleVideo());
        lucide.createIcons();
        
        // Force play video on load
        this.bgVideo.play().catch(err => {
            console.log("Autoplay was prevented by browser, waiting for interaction.");
        });

        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    toggleVideo() {
        if (this.bgVideo.paused) {
            this.bgVideo.play();
            this.videoToggle.setAttribute('data-state', 'playing');
            this.videoToggle.innerHTML = '<i data-lucide="pause"></i>';
        } else {
            this.bgVideo.pause();
            this.videoToggle.setAttribute('data-state', 'paused');
            this.videoToggle.innerHTML = '<i data-lucide="play"></i>';
        }
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    async handleLogin() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.showToast('Please enter a username');
            return;
        }

        this.setLoading(true);

        try {
            const delayPromise = new Promise(resolve => setTimeout(resolve, 5000));
            
            const githubUser = await this.fetchGitHubProfile(username);
            
            if (githubUser) {
                this.profileImage.src = githubUser.avatar_url;
                this.showToast('You are a developer login success');
            } else {
                this.showToast('Gust login success');
            }
            
            await delayPromise;

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Gust login success');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Short wait for error toast
        } finally {
            this.setLoading(false);
            // Ensure redirection happens even if we hit the catch block
            if (this.usernameInput.value.trim()) {
                 window.location.href = 'home.html';
            }
        }
    }

    async fetchGitHubProfile(username) {
        try {
            const response = await fetch(`https://api.github.com/users/${username}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch {
            return null;
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.loginBtn.disabled = true;
            this.btnLoader.style.display = 'block';
            this.btnText.textContent = 'Logging in...';
            this.profileRing.classList.add('loading');
        } else {
            this.loginBtn.disabled = false;
            this.btnLoader.style.display = 'none';
            this.btnText.textContent = 'Log In';
            this.profileRing.classList.remove('loading');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new LoginApp();
});
