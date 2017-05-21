package org.mbach.lemonde.home;

/**
 * RssItem class.
 *
 * @author Matthieu BACHELIER
 * @since 2017-05
 */
public class RssItem {

    private String link = null;
    private String title = null;
    private String description = null;
    private String pubDate = null;
    private String guid = null;
    private String enclosure = null;

    public RssItem() {

    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPubDate() {
        return pubDate;
    }

    public void setPubDate(String pubDate) {
        this.pubDate = pubDate;
    }

    public String getGuid() {
        return guid;
    }

    public void setGuid(String guid) {
        this.guid = guid;
    }

    public String getEnclosure() {
        return enclosure;
    }

    public void setEnclosure(String enclosure) {
        this.enclosure = enclosure;
    }
}