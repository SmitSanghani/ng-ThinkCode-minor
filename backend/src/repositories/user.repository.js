const User = require('../models/user.model');

class UserRepository {
    async findByEmail(email) {
        return await User.findOne({ email }).select('+passwordHash');
    }

    async findByUsername(username) {
        return await User.findOne({ username });
    }

    async findById(id) {
        return await User.findById(id);
    }

    async create(userData) {
        return await User.create(userData);
    }

    async update(id, updateData) {
        return await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    }

    async findOne(query) {
        return await User.findOne(query);
    }
}

module.exports = new UserRepository();
