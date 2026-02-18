const RefreshToken = require('../models/refreshToken.model');

class AuthRepository {
    async createRefreshToken(data) {
        return await RefreshToken.create(data);
    }

    async findRefreshToken(tokenHash) {
        return await RefreshToken.findOne({ tokenHash });
    }

    async deleteRefreshToken(tokenHash) {
        return await RefreshToken.findOneAndDelete({ tokenHash });
    }

    async deleteById(id) {
        return await RefreshToken.findByIdAndDelete(id);
    }
}

module.exports = new AuthRepository();
