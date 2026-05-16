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
        
        this.bgVideo.play().catch(() => {});

        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    toggleVideo() {
        if (this.bgVideo.paused) {
            this.bgVideo.play();
            this.videoToggle.innerHTML = '<i data-lucide="pause"></i>';
        } else {
            this.bgVideo.pause();
            this.videoToggle.innerHTML = '<i data-lucide="play"></i>';
        }
        if (window.lucide) lucide.createIcons();
    }

    async handleLogin() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.showToast('Please enter a username');
            return;
        }

        this.setLoading(true);

        try {
            const githubUser = await this.fetchGitHubProfile(username);
            
            if (githubUser) {
                this.profileImage.src = githubUser.avatar_url;
                this.showToast('Login success');
            } else {
                this.showToast('Guest login success');
            }
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
        } catch (error) {
            this.showToast('Login success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
        }
    }

    async fetchGitHubProfile(username) {
        try {
            const response = await fetch(`https://api.github.com/users/${username}`);
            return response.ok ? await response.json() : null;
        } catch {
            return null;
        }
    }

    setLoading(isLoading) {
        this.loginBtn.disabled = isLoading;
        this.btnLoader.style.display = isLoading ? 'block' : 'none';
        this.btnText.textContent = isLoading ? 'Logging in...' : 'Access Dashboard';
        if (isLoading) this.profileRing.classList.add('loading');
        else this.profileRing.classList.remove('loading');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => new LoginApp());
