const bcrypt = require('bcrypt');
const axios = require('axios');
const userRepository = require('../repositories/userRepository');

class UserService {
  async getAllUsers() {
    try {
      return await userRepository.findAll();
    } catch (error) {
      console.error('Error fetching users:', error.message);
      throw new Error('Unable to fetch users');
    }
  }

  async getUserById(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async createUser(name, password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      return await userRepository.create({
        name,
        password: hashedPassword
      });
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw new Error('Unable to create user');
    }
  }

  async populateRandomUsers(count = 3) {
    try {
      const urls = Array(count).fill(null).map(() => 
        axios.get('https://randomuser.me/api/')
      );
      
      const results = await Promise.all(urls);
      const randomUsers = results.map(r => r.data.results[0]);

      const createdUsers = [];
      
      for (const u of randomUsers) {
        const fullName = `${u.name.first} ${u.name.last}`;
        const user = await this.createUser(fullName, u.login.password);
        createdUsers.push(user);
      }

      console.log(`✅ Inserted ${createdUsers.length} users into database`);
      return createdUsers;
    } catch (error) {
      console.error('❌ Error populating users:', error.message);
      throw new Error('Unable to populate users');
    }
  }

  async getUserCount() {
    try {
      return await userRepository.count();
    } catch (error) {
      console.error('Error counting users:', error.message);
      throw new Error('Unable to count users');
    }
  }
}

module.exports = new UserService();
