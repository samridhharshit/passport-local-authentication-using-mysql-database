const LocalStrategy = require('passport-local')
    .Strategy

const bcrypt = require("bcryptjs");

async function initialize(passport, getUserByEmail, getUserId) {

    const authenticateUser = async (email, password, done) => {
        const user = await getUserByEmail(email);
        console.log(user);
        if (!user) {
            return done(null, false, { message: 'no user found!' })
        }

        try {
            if (await bcrypt.compare(password, user.Password)) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'password doest not match' })
            }
        } catch (e) {
            return done(e)
        }

    }


    passport.use(new LocalStrategy({ usernameField: 'email' },
        authenticateUser))

    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
       return done(null, getUserId(id))
     })
}

module.exports = initialize;
