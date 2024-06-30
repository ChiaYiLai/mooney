export const firebaseConfig = {
    apiKey: "AIzaSyCeuhpIpQ-pHI-qPgTP_K5l5HMHufTcKrI",
    authDomain: "goodthings-f98a9.firebaseapp.com",
    databaseURL: "https://goodthings-f98a9.firebaseio.com",
    projectId: "goodthings-f98a9",
    storageBucket: "goodthings-f98a9.appspot.com",
    messagingSenderId: "1079841576572",
    appId: "1:1079841576572:web:1f827bc726b8b7f41adbf9",
    measurementId: "G-B052RQXWPE"
}

export const uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        },
    },
    signInOptions: [
        {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            signInMethod: firebase.auth.EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD,
        },
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
}
