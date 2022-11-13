const { assert } = require("chai");
const { findUserByEmail, generateRandomString} = require("../helpers.js");
const bcrypt = require("bcryptjs");

//tests
const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("123", 10),
  },
};

describe("findUserByEmail", function() {
  it("should return a user with valid email", function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.equal(user.id, expectedUserID);
  });

  it("should return undefined if the email is not found in the database", function() {
    const user = findUserByEmail("user3@example.com", testUsers);
    const expectedUser = undefined;

    assert.equal(user, expectedUser);
  });
});

describe("generateRandomString", function() {
  it("should return a string with 6 characters", function() {
    const expected = "b2xVn2";
    const actual = generateRandomString();

    assert.equal(actual.length, expected.length);
  });
});