package org.mbach.lemonde.article;

import java.util.ArrayList;

public class LiveModel extends Model {

    private String authorName;
    private String authorAvatar;
    private String date;
    private ArrayList<SubModel> subModels;

    public LiveModel() {
        super(Model.LIVE_TYPE);
        this.subModels = new ArrayList<>();
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorName() {
        return this.authorName;
    }

    public String getAuthorAvatar() {
        return authorAvatar;
    }

    public void setAuthorAvatar(String authorAvatar) {
        this.authorAvatar = authorAvatar;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public void addParagraph(String html) {
        Paragraph paragraph = new Paragraph();
        paragraph.setHtml(html);

        subModels.add(paragraph);
    }

    public ArrayList<SubModel> getSubModels() {
        return this.subModels;
    }

    public class SubModel {

    }

    public class Quote {

    }

    public class Image {

    }

    public class Video {

    }

    public class Paragraph extends SubModel {
        private String html;

        public String getHtml() {
            return html;
        }

        public void setHtml(String html) {
            this.html = html;
        }
    }


}
