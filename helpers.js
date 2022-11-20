//find email in database
const findUserByEmail = (email, database) => {
  for (let keys in database) {
    if (database[keys].email === email) {
      return database[keys];
    }
  }
  return;
};

//filters out URLs that do not belong to logged in user
const getUrlsByUser = (userID, database) => {
  const urls = {};
  for (const key in database) {
    const record = database[key];
    if (userID === record.userID) {
      urls[key] = record;
    }
  }
  return urls;
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

module.exports = {
  generateRandomString,
  findUserByEmail,
  getUrlsByUser
};


