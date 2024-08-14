document.addEventListener('DOMContentLoaded', function() {
  const content = document.getElementById('content');
  const links = document.querySelectorAll('nav a');
  const themeToggle = document.getElementById('theme-toggle');

  let db;
  const request = indexedDB.open('myDatabase', 1);

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    const objectStore = db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('username', 'username', { unique: true });
    objectStore.createIndex('email', 'email', { unique: false });
  };

  request.onsuccess = function(event) {
    db = event.target.result;
  };

  request.onerror = function(event) {
    console.error('IndexedDB error:', event.target.errorCode);
  };

  links.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      const page = event.target.getAttribute('data-page');
      loadPage(page);
    });
  });

  function loadPage(page) {
    fetch(`pages/${page}.html`)
      .then(response => response.text())
      .then(data => {
        content.innerHTML = data;
        if (page === 'contact') {
          const form = document.getElementById('contact-form');
          form.addEventListener('submit', handleFormSubmit);
        } else if (page === 'login') {
          const form = document.getElementById('login-form');
          form.addEventListener('submit', handleLogin);
        } else if (page === 'register') {
          const form = document.getElementById('register-form');
          form.addEventListener('submit', handleRegister);
        } else if (page === 'profile') {
          const form = document.getElementById('profile-form');
          form.addEventListener('submit', handleProfileUpdate);
          loadProfile();
        }
      });
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message')
    };

    fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById('form-response').textContent = 'Message envoyé avec succès !';
      form.reset();
    })
    .catch(error => {
      document.getElementById('form-response').textContent = 'Une erreur est survenue. Veuillez réessayer.';
    });
  }

  function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');

    if (username === 'test' && password === 'test') {
      localStorage.setItem('username', username);
      document.getElementById('login-response').textContent = 'Connexion réussie !';
      loadPage('home');
    } else {
      document.getElementById('login-response').textContent = 'Nom d\'utilisateur ou mot de passe incorrect.';
    }
  }

  function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');

    const transaction = db.transaction(['profiles'], 'readwrite');
    const objectStore = transaction.objectStore('profiles');
    const request = objectStore.add({ username, password });

    request.onsuccess = function(event) {
      document.getElementById('register-response').textContent = 'Inscription réussie !';
      loadPage('login');
    };

    request.onerror = function(event) {
      console.error('IndexedDB error:', event.target.errorCode);
      document.getElementById('register-response').textContent = 'Une erreur est survenue. Veuillez réessayer.';
    };
  }

  function handleProfileUpdate(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');

    const transaction = db.transaction(['profiles'], 'readwrite');
    const objectStore = transaction.objectStore('profiles');
    const request = objectStore.put({ username, email });

    request.onsuccess = function(event) {
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      document.getElementById('profile-response').textContent = 'Profil mis à jour avec succès !';
    };

    request.onerror = function(event) {
      console.error('IndexedDB error:', event.target.errorCode);
      document.getElementById('profile-response').textContent = 'Une erreur est survenue. Veuillez réessayer.';
    };
  }

  function loadProfile() {
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    if (username) {
      document.getElementById('username').value = username;
    }
    if (email) {
      document.getElementById('email').value = email;
    }
  }

  function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  }

  themeToggle.addEventListener('click', toggleTheme);

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  function requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            new Notification('Notifications activées !');
          }
        });
    }
  }

  function sendNotification(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  const notifyButton = document.createElement('button');
  notifyButton.textContent = 'Activer les notifications';
  notifyButton.addEventListener('click', requestNotificationPermission);
  document.body.appendChild(notifyButton);

  loadPage('home');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function(error) {
      console.log('Service Worker registration failed:', error);
    });
}
