package chatbox;

public class Hashes {
    public static String MD5(String md5) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] array = md.digest(md5.getBytes());
            StringBuffer sb = new StringBuffer();
            for (int i = 0; i < array.length; ++i) {
                sb.append(Integer.toHexString((array[i] & 0xFF) | 0x100).substring(1,3));
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            //Do nothing
        }
        return null;
    }

    public static String randomString() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        return new java.math.BigInteger(130, random).toString(32);
    }
}
