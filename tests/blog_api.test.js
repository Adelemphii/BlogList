const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const mongoose = require('mongoose')

const Blog = require('../models/blog')
const User = require('../models/user')

const supertest = require('supertest')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')

const app = require('../app')

const api = supertest(app)

let authToken = ''

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'adelemphii',
      name: 'Adele',
      password: 'potato'
    }

    await api.post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'potato'
    }

    const result = await api.post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username too short', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'fu',
      name: 'bar',
      password: 'potato'
    }

    const result = await api.post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('minimum allowed length'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if password too short', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'foo',
      name: 'bar',
      password: 'j'
    }

    const result = await api.post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('Password must be'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

describe('when there are some blogs saved initially', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)

    // Log in and store auth token
    const loginResponse = await api.post('/api/login').send({ username: 'root', password: 'sekret' })
    authToken = `Bearer ${loginResponse.body.token}`
  })

  test('blogs are returned as json', async () => {
    await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  describe('addition of a new blog', () => {
    test('a valid blog can be added', async () => {
      const newBlog = { title: 'async/await simplifies making async calls', author: 'String 3', url: 'String3', likes: 122 }

      await api.post('/api/blogs')
        .set('Authorization', authToken)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    })

    test('blog without title is not added', async () => {
      const newBlog = { author: 'String 3', url: 'String3', likes: 122 }

      await api.post('/api/blogs')
        .set('Authorization', authToken)
        .send(newBlog)
        .expect(400)
    })

    test('adding a blog fails with 401 Unauthorized if token is not provided', async () => {
      const newBlog = { title: 'Test Blog', author: 'Test Author', url: 'testurl.com', likes: 100 }

      await api.post('/api/blogs')
        .send(newBlog)
        .expect(401)
    })
  })

  describe('deletion of a blog', () => {
    test('a blog can be deleted by the user who created it', async () => {
      const newBlog = { title: 'Blog to delete', author: 'String 4', url: 'String4', likes: 200 }
      const createResponse = await api.post('/api/blogs')
        .set('Authorization', authToken)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogId = createResponse.body.id

      await api.delete(`/api/blogs/${blogId}`)
        .set('Authorization', authToken)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()
      const blogIds = blogsAtEnd.map(blog => blog.id)
      assert(!blogIds.includes(blogId))
    })

    test('deletion fails with 401 Unauthorized if no token is provided', async () => {
      const blogToDelete = helper.initialBlogs[0]

      await api.delete(`/api/blogs/${blogToDelete.id}`)
        .expect(401)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})