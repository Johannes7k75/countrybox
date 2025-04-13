package user

import (
	"country-box/internal/database/repo"
	"crypto/rand"
	"encoding/hex"
)

type UserController struct {
	UserRepo     *repo.UserRepo
	SettingsRepo *repo.SettingsRepo
}

func NewUserController(userRepo *repo.UserRepo, settingsRepo *repo.SettingsRepo) *UserController {
	return &UserController{
		UserRepo:     userRepo,
		SettingsRepo: settingsRepo,
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

	userID, err := c.UserRepo.Create(email, hashedPassword, []repo.UserRole{repo.RoleUser})
	if err != nil {
		return -1, err
	}

	_, err = c.SettingsRepo.Create(userID)
	if err != nil {
		c.UserRepo.Delete(userID)
		return -1, err
	}

	return userID, nil
}
