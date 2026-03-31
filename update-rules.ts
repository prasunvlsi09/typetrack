import fs from 'fs';

let rules = fs.readFileSync('firestore.rules', 'utf-8');

rules = rules.replace(
  `    function isAdmin() {
      return isAuthenticated() && (
        ('name' in request.auth.token && request.auth.token.name.matches('.*\\\\.admin$') && 'email' in request.auth.token && request.auth.token.email.matches('.*@typetrack\\\\.local$')) ||
        ('email' in request.auth.token && (
          request.auth.token.email == "rajarin@typetrack.local" ||
          request.auth.token.email == "pratyus@typetrack.local" ||
          request.auth.token.email == "pratyusalt@typetrack.local"
        ))
      );
    }`,
  `    function isAdmin() {
      return isAuthenticated() && (
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin') ||
        ('name' in request.auth.token && request.auth.token.name.matches('.*\\\\.admin$') && 'email' in request.auth.token && request.auth.token.email.matches('.*@typetrack\\\\.local$')) ||
        ('email' in request.auth.token && (
          request.auth.token.email == "rajarin@typetrack.local" ||
          request.auth.token.email == "pratyus@typetrack.local" ||
          request.auth.token.email == "pratyusalt@typetrack.local"
        ))
      );
    }`
);

rules = rules.replace(
  `    function isValidUser(data) {
      return data.uid is string && data.uid.size() > 0 && data.uid.size() < 100 &&
             data.email is string && data.email.size() >= 0 && data.email.size() < 200 &&
             (!('displayName' in data) || (data.displayName is string && data.displayName.size() < 200)) &&
             (!('photoURL' in data) || (data.photoURL is string && data.photoURL.size() < 2000));
    }`,
  `    function isValidUser(data) {
      return data.uid is string && data.uid.size() > 0 && data.uid.size() < 100 &&
             data.email is string && data.email.size() >= 0 && data.email.size() < 200 &&
             (!('displayName' in data) || (data.displayName is string && data.displayName.size() < 200)) &&
             (!('photoURL' in data) || (data.photoURL is string && data.photoURL.size() < 2000)) &&
             (!('role' in data) || (data.role is string && data.role.size() < 50)) &&
             (!('disabled' in data) || data.disabled is bool);
    }`
);

rules = rules.replace(
  `      allow update: if isOwner(userId) && isValidUser(request.resource.data) && uidNotModified();`,
  `      allow update: if (isOwner(userId) || isAdmin()) && isValidUser(request.resource.data) && uidNotModified();`
);

fs.writeFileSync('firestore.rules', rules);
console.log('Rules updated');
