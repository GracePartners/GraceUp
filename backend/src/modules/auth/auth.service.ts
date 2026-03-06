import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../../shared/database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly database: DatabaseService
  ) {}

  async register(email: string, password: string, fullName: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.database.query(
      `INSERT INTO users (email, full_name)
       VALUES ($1,$2)
       RETURNING id,email,full_name`,
      [email, fullName]
    );

    return user.rows[0];
  }

  async login(email: string, password: string) {
    const result = await this.database.query(
      `SELECT id,email FROM users WHERE email=$1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email
    });

    return {
      access_token: token
    };
  }
}