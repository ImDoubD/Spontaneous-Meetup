import User, { IUser } from '../model/userModel';
import { generateToken } from '../middlewares/authMiddleware';

class AuthService {    
    public async register(email: string, password: string): Promise<string> {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new Error('User already exists');
        }
    
        const user = new User({ email, password });
        await user.save();
        return "User created successfully";
    }
    
    public async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('Invalid credentials');
        }
    
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          throw new Error('Invalid credentials');
        }

        const token = generateToken(user._id as string);
        return { user, token };
      }

}

export default new AuthService();
