interface GitHubUser {
    avatar_url: string;
    login: string;
}

class LoginApp {
    private usernameInput: HTMLInputElement;
    private loginBtn: HTMLButtonElement;
    private profileRing: HTMLElement;
    private profileImage: HTMLImageElement;
    private toastContainer: HTMLElement;
    private btnLoader: HTMLElement;
    private btnText: HTMLElement;

    constructor() {
        this.usernameInput = document.getElementById('username') as HTMLInputElement;
        this.loginBtn = document.getElementById('loginBtn') as HTMLButtonElement;
        this.profileRing = document.getElementById('profileRing') as HTMLElement;
        this.profileImage = document.getElementById('profileImage') as HTMLImageElement;
        this.toastContainer = document.getElementById('toastContainer') as HTMLElement;
        this.btnLoader = document.getElementById('btnLoader') as HTMLElement;
        this.btnText = document.querySelector('.btn-text') as HTMLElement;

        this.init();
    }

    private init() {
        this.loginBtn.addEventListener('click', () => this.handleLogin());
        
        // Allow enter key to trigger login
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
    }

    private async handleLogin() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            this.showToast('Please enter a username');
            return;
        }

        this.setLoading(true);

        try {
            // Start the 5 second delay timer
            const delayPromise = new Promise(resolve => setTimeout(resolve, 5000));
            
            // Attempt to fetch GitHub profile
            const githubUser = await this.fetchGitHubProfile(username);
            
            if (githubUser) {
                this.profileImage.src = githubUser.avatar_url;
                this.showToast('You are a developer login success');
            } else {
                this.showToast('Gust login success');
            }

            // Wait for the remainder of the 5 seconds if fetch was fast
            await delayPromise;

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Gust login success'); // Fallback to Guest on error
        } finally {
            this.setLoading(false);
        }
    }

    private async fetchGitHubProfile(username: string): Promise<GitHubUser | null> {
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

    private setLoading(isLoading: boolean) {
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

    private showToast(message: string) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
    new LoginApp();
});
