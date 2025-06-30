import { StyleSheet } from 'react-native';
import {
  BUTTON_PADDING,
  BUTTON_BORDER_RADIUS,
  FONT_SIZE_MD,
  FONT_SIZE_SM,
  FONT_SIZE_XL,
  FONT_SIZE_LG,
} from './constants/layout';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  logoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#d81b60',
    marginBottom: 12,
    textAlign: 'center'
  },
  input: {
    width: '100%',
    borderColor: '#d81b60',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: BUTTON_PADDING_SM,
    paddingHorizontal: 16,
    fontSize: FONT_SIZE_MD,
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  googleBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: BUTTON_PADDING,
    borderRadius: BUTTON_BORDER_RADIUS,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
  emailBtn: {
    backgroundColor: '#d81b60',
    paddingVertical: BUTTON_PADDING,
    borderRadius: BUTTON_BORDER_RADIUS,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
  btnText: {
    color: '#fff',
    fontSize: FONT_SIZE_MD,
    fontWeight: '600'
  },
  backLink: {
    color: '#666',
    fontSize: FONT_SIZE_SM,
    marginTop: 20,
    textDecorationLine: 'underline'
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16
  },
  genderButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  genderSelected: {
    backgroundColor: '#d81b60',
    borderColor: '#d81b60'
  },
  genderText: {
    fontSize: FONT_SIZE_MD,
    color: '#333'
  },
  genderTextSelected: {
    color: '#fff'
  },
  uploadBtn: {
    marginBottom: 20
  },
  uploadText: {
    fontSize: FONT_SIZE_MD,
    color: '#888',
    textDecorationLine: 'underline'
  },
  navBtn: {
    backgroundColor: '#222',
    paddingVertical: BUTTON_PADDING,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4
  },
  navBtnText: {
    color: '#fff',
    fontSize: FONT_SIZE_MD,
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    width: 320
  },
  cardImage: {
    width: 280,
    height: 280,
    borderRadius: 15,
    marginBottom: 10
  },
  cardName: {
    fontSize: FONT_SIZE_XL,
    fontWeight: 'bold',
    color: '#222'
  },
  cardBio: {
    fontSize: FONT_SIZE_MD,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f6',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    width: '100%'
  },
  matchAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f5',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    width: '100%'
  },
  gameIcon: {
    fontSize: 28,
    marginRight: 16
  },
  gameTitle: {
    fontSize: FONT_SIZE_LG,
    fontWeight: '600'
  },
  notificationBox: {
    backgroundColor: '#ffe0ec',
    padding: 14,
    marginVertical: 6,
    borderRadius: BUTTON_BORDER_RADIUS,
    width: '100%'
  },
  notificationText: {
    fontSize: FONT_SIZE_MD,
    color: '#d81b60'
  },
  settingText: {
    fontSize: FONT_SIZE_MD,
    color: '#666',
    marginBottom: 6
  },
  swipeScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40
  },
  swipeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: 50
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5
  },
  buttonIcon: {
    fontSize: 28,
    color: '#fff'
  }
});

export default styles;