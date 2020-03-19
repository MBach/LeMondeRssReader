package org.mbach.lemonde.article;

class CommentModel extends Model {

    private String author;
    private String date;
    private String content;

    CommentModel() {
        super(Model.COMMENT_TYPE);
    }

    public String getAuthor() {
        return author;
    }

    void setAuthor(String author) {
        this.author = author;
    }

    public String getDate() {
        return date;
    }

    void setDate(String date) {
        this.date = date;
    }

    public String getContent() {
        return content;
    }

    void setContent(String content) {
        this.content = content;
    }
}
