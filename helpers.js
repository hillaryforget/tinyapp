//find email in database
const findUserByEmail = (email, database) => {
  for (let keys in database) {
    if (database[keys].email === email) {
      return database[keys];
    }
  }
  return;
};

//will create a random 6 char id
const generateRandomString = () => {
  const characters = "1234567890abcdefghijklmnopqrstuvwxyz";
  const charsLength = characters.length;
  let output = "";
  for (let i = 0; i < 6; i++) {
    output += characters.charAt(Math.floor(Math.random() * charsLength));
  }
  return output;
};
//DO I EVEN NEED THESE????????????????????????
//checks if passwords match
// const checkPassword = (users, email, password) => {
//   const user = Object.values(users).find((user) => user.email === email);
//   if (!user) return false;
//   return user.password === password;
// };

// //returns the URLs where the userID is equal to the id of the currently logged-in user
// const urlsForUser = (id, database) => {
//   let urls = {};
//   for (let keys in database) {
//     if (database[keys].userID === id) {
//       urls[keys] = { longURL: database[keys].longURL };
//     }
//   }
//   return urls;
// };

module.exports = {
  generateRandomString,
  findUserByEmail,

};


