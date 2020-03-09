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

    public String getAuthorName() {
        return this.authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
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

    public ArrayList<SubModel> getSubModels() {
        return this.subModels;
    }

    public void addSubModels(ArrayList<SubModel> subModels) {
        this.subModels.addAll(subModels);
    }

    public Paragraph buildParagraph(String html) {
        Paragraph paragraph = new Paragraph();
        paragraph.setHtml(html);

        return paragraph;
    }

    public Image buildImage(String url) {
        Image image = new Image();
        image.setUrl(url);

        return image;
    }

    public Quote buildQuote(String html) {
        Quote quote = new Quote();
        quote.setHtml(html);

        return quote;
    }


    public class SubModel {

    }

    public class Quote extends SubModel {
        private String html;

        public String getHtml() {
            return html;
        }

        public void setHtml(String html) {
            this.html = html;
        }
    }

    public class Image extends SubModel {
        private String url;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }

    public class Video extends SubModel {

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
