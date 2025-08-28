const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const { User, ROLES } = require('../models/User'); 

//  Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id, name, emails } = profile;
        const email = emails && emails.length > 0 ? emails[0].value : null;

        if (!email) {
            return done(new Error("Brak adresu e-mail w profilu Google."), false);
        }

        let user = await User.findOne({ login: email });

        if (!user) {
            const userRole = (email === 'milosz.pradela1@gmail.com') ? ROLES.ADMIN : ROLES.READONLY;

            user = new User({
                imie: name.givenName || 'Użytkownik',
                nazwisko: name.familyName || 'Google', 
                login: email,
                password: await bcrypt.hash(id, 10),
                rola: userRole, 
            });
            await user.save();
        }
        
        return done(null, user);
    } catch (error) {
        return done(error, false);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
