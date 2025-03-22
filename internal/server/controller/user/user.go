package user

import (
	"country-box/internal/server/repo"
	"crypto/rand"
	"encoding/hex"
)

type UserController struct {
	UserRepo *repo.UserRepository
}

func NewUserController(userRepo *repo.UserRepository) *UserController {
	return &UserController{
		UserRepo: userRepo,
	}
}

func (c *UserController) RemovePassword(user *repo.User) repo.PasswordLessUser {
	return repo.PasswordLessUser{
		Id:    user.Id,
		Email: user.Email,
		Roles: user.Roles,
	}
}

func (c *UserController) GenerateAccountNumber(length int) string {
	accountId := make([]byte, length/2)
	rand.Read(accountId)
	return hex.EncodeToString(accountId)
}

func (c *UserController) CreateUser(email, password string) (int, error) {
	hashedPassword := Hashpassword(password)

	userID, err := c.CreateUser(email, hashedPassword)
	if err != nil {
		return -1, err
	}

	return userID, nil
}
