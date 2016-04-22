import matplotlib as mpl
mpl.use('Agg')

from config_reader import config_reader
from applymodel import applymodel
from visualize_save import visualize_save
import sys
import getopt
import cv2 as cv

def detect(filename):
    param, model = config_reader()

    image = cv.imread(filename)
    if image.shape[0] > 500:
    	scale = 500.0 / image.shape[0]
    	image = cv.resize(image, (0,0), fx=scale, fy=scale, interpolation=cv.INTER_CUBIC)
    	cv.imwrite(filename, image)
    #print sys.argv[1]
    #test_image = sys.argv[1] #'../sample_image/im1429.jpg'
    heatmaps, prediction = applymodel(filename, param, model)
    visualize_save(filename, heatmaps, prediction, param, model) # save images