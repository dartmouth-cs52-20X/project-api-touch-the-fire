import firebase from 'firebase';

const config = {
  apiKey: 'AIzaSyBydGIcpkQZWWRzmVCEpdrb4TlxZHl5hlo',
  authDomain: 'touch-the-fire.firebaseapp.com',
  databaseURL: 'https://touch-the-fire.firebaseio.com',
  projectId: 'touch-the-fire',
  storageBucket: 'touch-the-fire.appspot.com',
  messagingSenderId: '731232144501',
  appId: '1:731232144501:web:c45dddd6bd3b4ac1c7fc3c',
};

firebase.initializeApp(config);

const database = firebase.database().ref('user');

export default database;

// export function fetchUsers(callback) {
//   database.on('value', (snapshot) => {
//     const newUserState = snapshot.val();
//     callback(newUserState);
//   });
// }

// export function addUser(user) {
//   database.push(user);
// }

// export function deleteUser(id) {
//   database.child(id).remove();
// }

// export function updateUser(id, user) {
//   database.child(id).update(user);
// }
