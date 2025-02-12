import { Request, Response } from 'express';
import authService from '../service/authService';

class AuthController {

  /**
   * Handles user registration.
   * Expects `email` and `password` in the request body.
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.register(email, password);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

   /**
   * Handles user login and provides authentication bearer token.
   * Expects `email` and `password` in the request body.
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      res.status(200).json({ user, token });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
