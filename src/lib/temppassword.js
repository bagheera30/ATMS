function randomPassword() {
  const randomChar = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const password = [
    randomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 
    randomChar("!@#$%^&*"), 
    ...Array(4)
      .fill()
      .map(() => randomChar("abcdefghijklmnopqrstuvwxyz")), 
  ];
  return password.sort(() => Math.random() - 0.5).join("");
}

module.exports = { randomPassword };
