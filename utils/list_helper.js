const _ = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  let likes = 0
  blogs.forEach(element => {
    likes += element.likes
  })
  return likes
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((max, blog) => blog.likes > max.likes ? blog : max, blogs[0])
}

const mostBlogs = (blogs) => {
  const authorCounts = _.countBy(blogs, 'author')
  const mostBlogs = _.maxBy(_.toPairs(authorCounts), pair => pair[1])
  return {
    author: mostBlogs[0],
    blogs: mostBlogs[1]
  }
}

const mostLikes = (blogs) => {
  const authorBlogs = _.groupBy(blogs, 'author')
  const sumLikes = _.mapValues(authorBlogs, (blogs) => _.sumBy(blogs, 'likes'))
  const maxLikesAuthor = _.maxBy(_.toPairs(sumLikes), pair => pair[1])

  return { author: maxLikesAuthor[0], likes: maxLikesAuthor[1] }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}